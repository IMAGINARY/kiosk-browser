#!/bin/sh
cd "${0%/*}"
#inkscape --export-png=512.png --export-background-opacity=0 --without-gui -h 512 -w 512 icon.svg
for i in 16 32 48 128 256 512 1024; 
do 
echo $i; 
#convert 512.png -resize $i $i.png; 
inkscape --export-png="${i}x${i}.png" --export-background-opacity=0 --without-gui -h $i -w $i icon.svg
done

png2icns icon.icns 16x16.png 32x32.png 48x48.png 128x128.png 256x256.png 512x512.png 1024x1024.png
# rm 16.png 32.png 48.png 128.png 256.png 512.png
