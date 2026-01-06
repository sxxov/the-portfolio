#!/usr/bin/env bash

set -euo pipefail

root="./wp-content/uploads"
min_size="+25M"
min_bytes=$((25 * 1024 * 1024))
threads="${VIDEO_THREADS:-1}"
filter_threads="${VIDEO_FILTER_THREADS:-1}"

if stat -f%z "$0" >/dev/null 2>&1; then
	file_size() { stat -f%z "$1"; }
else
	file_size() { stat -c%s "$1"; }
fi

process_file() {
	local f="$1"
	local report_small="${2:-1}"

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

	codec=$(ffprobe -v error -select_streams v:0 \
		-show_entries stream=codec_name \
		-of default=nokey=1:noprint_wrappers=1 \
		"$f")

	if [ -z "$codec" ]; then
		echo "Skipping (no video stream): $f"
		return
	fi

	ext="${f##*.}"
	base="${f%.*}"
	ext_lc=$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')

	movflags=()
	case "$ext_lc" in
		mp4|m4v|mov) movflags=(-movflags +faststart) ;;
	esac

	vcodec=""
	qflag=""
	qmin=0
	qmax=0
	base_vflags=()
	case "$codec" in
		h264)
			vcodec="libx264"
			qflag="-crf"
			qmin=18
			qmax=40
			base_vflags=(-preset slow -pix_fmt yuv420p)
			;;
		hevc|h265)
			vcodec="libx265"
			qflag="-crf"
			qmin=20
			qmax=42
			base_vflags=(-preset slow -pix_fmt yuv420p)
			;;
		vp9)
			vcodec="libvpx-vp9"
			qflag="-crf"
			qmin=24
			qmax=50
			base_vflags=(-b:v 0 -deadline good -cpu-used 2 -pix_fmt yuv420p)
			;;
		av1)
			vcodec="libaom-av1"
			qflag="-crf"
			qmin=24
			qmax=50
			base_vflags=(-b:v 0 -cpu-used 4 -pix_fmt yuv420p)
			;;
		mpeg4)
			vcodec="mpeg4"
			qflag="-q:v"
			qmin=4
			qmax=31
			base_vflags=(-pix_fmt yuv420p)
			;;
		*)
			echo "Skipping (unsupported codec for re-encode): $codec ($f)"
			return
			;;
	esac

	tmp_dir="${base}.tmpdir.$$"
	mkdir -p "$tmp_dir"

	scale_factors=(1.0 0.85 0.7 0.55 0.4)
	max_iters=8
	best_final=""
	best_final_size=0

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

			if ! ffmpeg -nostdin -y -i "$f" \
				-map 0 \
				-map_metadata 0 \
				-threads "$threads" \
				-filter_threads "$filter_threads" \
				-c:v "$vcodec" "${base_vflags[@]}" "$qflag" "$q" \
				-vf "scale=trunc(iw*${scale}/2)*2:trunc(ih*${scale}/2)*2" \
				-c:a copy \
				-c:s copy \
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

			attempt_size=$(file_size "$attempt_tmp")
			if [ "$attempt_size" -le "$min_bytes" ]; then
				best_size="$attempt_size"
				best_tmp="${tmp_dir}/best.${ext}"
				mv "$attempt_tmp" "$best_tmp"
				high=$((q - 1))
			else
				low=$((q + 1))
				rm -f "$attempt_tmp"
			fi

			iter=$((iter + 1))
		done

		if [ -n "$best_tmp" ]; then
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

if [ "$#" -gt 0 ]; then
	for f in "$@"; do
		process_file "$f" 1
	done
else
	find "$root" -type f -size "$min_size" -print0 |
	while IFS= read -r -d '' f; do
		process_file "$f" 0
	done
fi
