find ./wp-content/uploads -type f -iname '*.mov' -print0 |
while IFS= read -r -d '' f; do
	codec=$(ffprobe -v error -select_streams v:0 \
		-show_entries stream=codec_name \
		-of default=nokey=1:noprint_wrappers=1 \
		"$f")

	if [ "$codec" = "h264" ]; then
		echo "Skipping (already H.264): $f"
		continue
	fi

	out="${f%.*}.mp4"
	ffmpeg -nostdin -y -i "$f" \
		-map_metadata 0 \
		-c:v libx264 \
		-profile:v high \
		-level 4.1 \
		-pix_fmt yuv420p \
		-movflags +faststart \
		-crf 23 \
		-preset slow \
		-vf "scale='min(1920,iw)':-2" \
		-c:a aac \
		-b:a 128k \
		"$out" && mv "$out" "$f"
done