#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd "$script_dir/.." && pwd)
cd "$repo_root"

root="wp-content/uploads"
backup_root="$repo_root/scripts/video.backups"
min_size="+25M"
min_bytes=$((25 * 1024 * 1024))
early_stop_min_bytes=$((20 * 1024 * 1024))
threads="${VIDEO_THREADS:-0}"
filter_threads="${VIDEO_FILTER_THREADS:-0}"
use_hw="${VIDEO_HW:-1}"

has_h264_vt=0
has_hevc_vt=0
if [ "$use_hw" = "1" ]; then
	encoder_list=$(ffmpeg -hide_banner -encoders 2>/dev/null || true)
	if command -v rg >/dev/null 2>&1; then
		if printf '%s' "$encoder_list" | rg -q "[[:space:]]h264_videotoolbox[[:space:]]"; then
			has_h264_vt=1
		fi
		if printf '%s' "$encoder_list" | rg -q "[[:space:]]hevc_videotoolbox[[:space:]]"; then
			has_hevc_vt=1
		fi
	else
		if printf '%s' "$encoder_list" | grep -q "[[:space:]]h264_videotoolbox[[:space:]]"; then
			has_h264_vt=1
		fi
		if printf '%s' "$encoder_list" | grep -q "[[:space:]]hevc_videotoolbox[[:space:]]"; then
			has_hevc_vt=1
		fi
	fi
fi

mkdir -p "$backup_root"

ffmpeg_log_flags=(-loglevel warning -stats)

if stat -f%z "$0" >/dev/null 2>&1; then
	file_size() { stat -f%z "$1"; }
else
	file_size() { stat -c%s "$1"; }
fi

validate_output() {
	ffprobe -hide_banner -v error -show_entries format=duration \
		-of default=nokey=1:noprint_wrappers=1 "$1" >/dev/null 2>&1
}

normalize_path() {
	local f="$1"
	f="${f#./}"
	if [ "${f#/}" != "$f" ]; then
		if [ "${f#$repo_root/}" = "$f" ]; then
			echo "Skipping (outside repo): $f"
			return 1
		fi
		f="${f#$repo_root/}"
	fi
	printf '%s' "$f"
}

backup_original() {
	local rel="$1"
	local backup_path="$backup_root/$rel"

	if [ -f "$backup_path" ]; then
		return
	fi

	mkdir -p "$(dirname "$backup_path")"
	cp -p "$rel" "$backup_path"
}

revert_files() {
	if [ "$#" -eq 0 ]; then
		echo "Usage: $0 revert <file_path_or_name> [more_files...]"
		return 1
	fi

	if [ ! -d "$backup_root" ]; then
		echo "No backups found in $backup_root"
		return 1
	fi

	local target
	for target in "$@"; do
		local rel
		if ! rel=$(normalize_path "$target"); then
			continue
		fi

		local backup_path="$backup_root/$rel"
		if [ ! -f "$backup_path" ]; then
			echo "No backup found for $rel"
			continue
		fi

		mkdir -p "$(dirname "$rel")"
		cp -p "$backup_path" "$rel"
		echo "Reverted: $rel"
	done
}

process_file() {
	local f="$1"
	local report_small="${2:-1}"
	local rel
	local profile_name
	local profile_level

	if ! rel=$(normalize_path "$f"); then
		return
	fi
	f="$rel"

	if [ ! -f "$f" ]; then
		echo "Skipping (missing file): $f"
		return
	fi

	if [ "$(file_size "$f")" -lt "$min_bytes" ]; then
		if [ "$report_small" -eq 1 ]; then
			echo "Skipping (under 25MB): $f"
		fi
		return
	fi

	codec=$(ffprobe -hide_banner -v error -select_streams v:0 \
		-show_entries stream=codec_name \
		-of default=nokey=1:noprint_wrappers=1 \
		"$f")

	if [ -z "$codec" ]; then
		echo "Skipping (no video stream): $f"
		return
	fi

	audio_index=$(ffprobe -hide_banner -v error -select_streams a:0 \
		-show_entries stream=index \
		-of default=nokey=1:noprint_wrappers=1 \
		"$f")
	if [ -n "$audio_index" ]; then
		has_audio=1
	else
		has_audio=0
	fi

	rate=$(ffprobe -hide_banner -v error -select_streams v:0 \
		-show_entries stream=avg_frame_rate \
		-of default=nokey=1:noprint_wrappers=1 \
		"$f")
	if [ -n "$rate" ] && [ "$rate" != "0/0" ]; then
		fps=$(awk -v r="$rate" 'BEGIN{split(r,a,"/"); if (a[2]==""||a[2]==0) {print a[1]} else {printf "%.3f", a[1]/a[2]}}')
		fps_int=$(awk -v f="$fps" 'BEGIN{printf "%d", (f+0.5)}')
		gop=$((fps_int * 2))
		if [ "$gop" -lt 24 ]; then gop=24; fi
		if [ "$gop" -gt 240 ]; then gop=240; fi
		min_keyint=$((gop / 2))
		if [ "$min_keyint" -lt 12 ]; then min_keyint=12; fi
	else
		gop=120
		min_keyint=60
		fps_int=30
	fi

	duration=$(ffprobe -hide_banner -v error -show_entries format=duration \
		-of default=nokey=1:noprint_wrappers=1 \
		"$f")
	target_kbps=$(awk -v size="$min_bytes" -v dur="$duration" 'BEGIN{ if (dur>0) { printf "%d", (size*8)/(dur*1000) } else { print 800 } }')
	if [ "$target_kbps" -lt 200 ]; then
		target_kbps=200
	fi

	ext="${f##*.}"
	base="${f%.*}"
	ext_lc=$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')

	movflags=()
	case "$ext_lc" in
		mp4|m4v|mov) movflags=(-movflags +faststart) ;;
	esac

	if [ "$has_audio" -eq 1 ]; then
		map_flags=(-map 0:v:0 -map 0:a:0)
	else
		map_flags=(-map 0:v:0)
	fi

	vcodec=""
	qflag=""
	qmin=0
	qmax=0
	q_suffix=""
	bitrate_mode=0
	base_vflags=()
	keyframe_flags=()
	profile_flags=()
	level_flags=()
	audio_flags=()
	case "$codec" in
		h264)
			profile_name=$(ffprobe -hide_banner -v error -select_streams v:0 \
				-show_entries stream=profile \
				-of default=nokey=1:noprint_wrappers=1 \
				"$f")
			profile_level=$(ffprobe -hide_banner -v error -select_streams v:0 \
				-show_entries stream=level \
				-of default=nokey=1:noprint_wrappers=1 \
				"$f")
			case "$profile_name" in
				*Baseline*) profile_flags=(-profile:v baseline) ;;
				*Main*) profile_flags=(-profile:v main) ;;
				*High*) profile_flags=(-profile:v high) ;;
			esac
			if [ -n "$profile_level" ] && [ "$profile_level" -gt 0 ] 2>/dev/null; then
				level_flags=(-level "$(awk -v l="$profile_level" 'BEGIN{printf "%.1f", l/10}')")
			fi
			if [ "$use_hw" = "1" ] && [ "$has_h264_vt" -eq 1 ]; then
				vcodec="h264_videotoolbox"
				qflag="-b:v"
				qmin=$((target_kbps / 3))
				qmax=$((target_kbps * 3))
				if [ "$qmin" -lt 200 ]; then qmin=200; fi
				if [ "$qmax" -le "$qmin" ]; then qmax=$((qmin * 2)); fi
				q_suffix="k"
				bitrate_mode=1
				base_vflags=(-pix_fmt yuv420p)
				keyframe_flags=(-g "$gop")
				profile_flags=()
				level_flags=()
			else
				vcodec="libx264"
				qflag="-crf"
				qmin=18
				qmax=40
				base_vflags=(-preset slow -pix_fmt yuv420p)
				keyframe_flags=(-x264-params "keyint=${gop}:min-keyint=${min_keyint}:scenecut=0:open-gop=0")
			fi
			if [ "$has_audio" -eq 1 ]; then
				audio_flags=(-c:a aac -b:a 192k)
			fi
			;;
		hevc|h265)
			profile_name=$(ffprobe -hide_banner -v error -select_streams v:0 \
				-show_entries stream=profile \
				-of default=nokey=1:noprint_wrappers=1 \
				"$f")
			profile_level=$(ffprobe -hide_banner -v error -select_streams v:0 \
				-show_entries stream=level \
				-of default=nokey=1:noprint_wrappers=1 \
				"$f")
			case "$profile_name" in
				*Main*) profile_flags=(-profile:v main) ;;
			esac
			if [ -n "$profile_level" ] && [ "$profile_level" -gt 0 ] 2>/dev/null; then
				level_flags=(-level "$(awk -v l="$profile_level" 'BEGIN{printf "%.1f", l/10}')")
			fi
			if [ "$use_hw" = "1" ] && [ "$has_hevc_vt" -eq 1 ]; then
				vcodec="hevc_videotoolbox"
				qflag="-b:v"
				qmin=$((target_kbps / 3))
				qmax=$((target_kbps * 3))
				if [ "$qmin" -lt 200 ]; then qmin=200; fi
				if [ "$qmax" -le "$qmin" ]; then qmax=$((qmin * 2)); fi
				q_suffix="k"
				bitrate_mode=1
				base_vflags=(-pix_fmt yuv420p)
				keyframe_flags=(-g "$gop")
				profile_flags=()
				level_flags=()
			else
				vcodec="libx265"
				qflag="-crf"
				qmin=20
				qmax=42
				base_vflags=(-preset slow -pix_fmt yuv420p)
				keyframe_flags=(-x265-params "keyint=${gop}:min-keyint=${min_keyint}:scenecut=0:open-gop=0")
			fi
			if [ "$has_audio" -eq 1 ]; then
				audio_flags=(-c:a aac -b:a 192k)
			fi
			;;
		vp9)
			vcodec="libvpx-vp9"
			qflag="-crf"
			qmin=24
			qmax=50
			base_vflags=(-b:v 0 -deadline good -cpu-used 2 -pix_fmt yuv420p)
			keyframe_flags=(-g "$gop")
			if [ "$has_audio" -eq 1 ]; then
				audio_flags=(-c:a aac -b:a 192k)
			fi
			;;
		av1)
			vcodec="libaom-av1"
			qflag="-crf"
			qmin=24
			qmax=50
			base_vflags=(-b:v 0 -cpu-used 4 -pix_fmt yuv420p)
			keyframe_flags=(-g "$gop")
			if [ "$has_audio" -eq 1 ]; then
				audio_flags=(-c:a aac -b:a 192k)
			fi
			;;
		mpeg4)
			vcodec="mpeg4"
			qflag="-q:v"
			qmin=4
			qmax=31
			base_vflags=(-pix_fmt yuv420p)
			keyframe_flags=(-g "$gop")
			if [ "$has_audio" -eq 1 ]; then
				audio_flags=(-c:a aac -b:a 192k)
			fi
			;;
		*)
			echo "Skipping (unsupported codec for re-encode): $codec ($f)"
			return
			;;
	esac

	tmp_dir="${base}.tmpdir.$$"
	mkdir -p "$tmp_dir"

	input_file="$f"
	if [ "$ext_lc" = "mov" ] || [ "$ext_lc" = "mp4" ] || [ "$ext_lc" = "m4v" ]; then
		prepped_input="${tmp_dir}/input.${ext}"
		if ! ffmpeg -hide_banner "${ffmpeg_log_flags[@]}" -nostdin -y -fflags +discardcorrupt+genpts -err_detect ignore_err -i "$f" \
			"${map_flags[@]}" \
			-c copy \
			-avoid_negative_ts make_zero \
			"${movflags[@]}" \
			"$prepped_input"; then
			echo "Failed to normalize timestamps: $f"
			rm -rf "$tmp_dir"
			return
		fi
		input_file="$prepped_input"
	fi

	scale_factors=(1.0 0.85 0.7 0.55 0.4)
	max_iters=8
	best_final=""
	best_final_size=0
	early_stop=0

	backup_original "$f"

	for scale in "${scale_factors[@]}"; do
		low=$qmin
		high=$qmax
		iter=0
		best_tmp=""
		best_size=0

		while [ "$low" -le "$high" ] && [ "$iter" -lt "$max_iters" ]; do
			q=$(((low + high) / 2))
			attempt_tmp="${tmp_dir}/attempt.${ext}"
			rm -f "$attempt_tmp"

			if ! ffmpeg -hide_banner "${ffmpeg_log_flags[@]}" -nostdin -y -fflags +discardcorrupt+genpts -err_detect ignore_err -i "$input_file" \
				"${map_flags[@]}" \
				-map_metadata 0 \
				-threads "$threads" \
				-filter_threads "$filter_threads" \
				-c:v "$vcodec" "${base_vflags[@]}" "${keyframe_flags[@]}" \
				"${profile_flags[@]+"${profile_flags[@]}"}" "${level_flags[@]+"${level_flags[@]}"}" "$qflag" "${q}${q_suffix}" \
				-vf "fps=${fps_int},scale=trunc(iw*${scale}/2)*2:trunc(ih*${scale}/2)*2,format=yuv420p" \
				-fps_mode cfr \
				${audio_flags[@]+"${audio_flags[@]}"} \
				"${movflags[@]}" \
				"$attempt_tmp"; then
				echo "Failed to transcode: $f"
				rm -rf "$tmp_dir"
				return
			fi

			if [ ! -s "$attempt_tmp" ]; then
				echo "Failed to create output: $attempt_tmp"
				rm -rf "$tmp_dir"
				return
			fi

			if ! validate_output "$attempt_tmp"; then
				echo "Invalid output (ffprobe failed): $attempt_tmp"
				rm -rf "$tmp_dir"
				return
			fi

			attempt_size=$(file_size "$attempt_tmp")
			if [ "$attempt_size" -le "$min_bytes" ]; then
				best_size="$attempt_size"
				best_tmp="${tmp_dir}/best.${ext}"
				mv "$attempt_tmp" "$best_tmp"
				if [ "$attempt_size" -ge "$early_stop_min_bytes" ]; then
					early_stop=1
					break
				fi
				if [ "$bitrate_mode" -eq 1 ]; then
					low=$((q + 1))
				else
					high=$((q - 1))
				fi
			else
				if [ "$bitrate_mode" -eq 1 ]; then
					high=$((q - 1))
				else
					low=$((q + 1))
				fi
				rm -f "$attempt_tmp"
			fi

			iter=$((iter + 1))
		done

		if [ -n "$best_tmp" ]; then
			best_final="$best_tmp"
			best_final_size="$best_size"
			break
		fi
		if [ "$early_stop" -eq 1 ]; then
			best_final="$best_tmp"
			best_final_size="$best_size"
			break
		fi
	done

	if [ -z "$best_final" ]; then
		echo "Unable to reach target size: $f"
		rm -rf "$tmp_dir"
		return
	fi

	if [ "$best_final_size" -ge "$(file_size "$f")" ]; then
		echo "Keeping original (no size win): $f"
		rm -rf "$tmp_dir"
		return
	fi

	mv "$best_final" "$f"
	rm -rf "$tmp_dir"
}

command="${1:-compress}"

if [ "$command" = "compress" ]; then
	shift || true
	if [ "$#" -gt 0 ]; then
		for f in "$@"; do
			process_file "$f" 1
		done
	else
		find "$root" -type f -size "$min_size" \( -iname '*.mov' -o -iname '*.mp4' -o -iname '*.m4v' -o -iname '*.mkv' -o -iname '*.avi' -o -iname '*.wmv' -o -iname '*.flv' -o -iname '*.mpeg' -o -iname '*.mpg' -o -iname '*.m2v' -o -iname '*.ogv' \) -print0 |
		while IFS= read -r -d '' f; do
			process_file "$f" 0
		done
	fi
elif [ "$command" = "revert" ]; then
	shift || true
	revert_files "$@"
else
	echo "Usage: $0 <compress|revert> [paths...]"
	exit 1
fi
