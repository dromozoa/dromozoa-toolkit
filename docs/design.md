# 設計メモ

## 色

- https://developer.apple.com/design/human-interface-guidelines/foundations/color/

### 画像の背景色

| Name       | Color   |
|------------|---------|
| Pixelmator | #1D1D1D |
| Preview    | #969696 |
| Firefox    | #222222 |
| Inkspace   | #D1D1D1 |

## 画像

### advancecompの実験

- [advancecomp](https://www.advancemame.it/)
- 得意なファイルと不得意なファイルがわかれる
- ImageMagickを通したあとにかけてもよい、くらい。

```
% advpng -z -4 -i 8 *.png
        3773        3468  91% apple-touch-icon.png
       15604        7209  46% google-play.png
        3172        2914  91% icon-192.png
        8154        6992  85% icon-512.png
       42749       42749 100% icon-index.png (Unsupported bit depth/color type, 8/4)
      355641      355641 100% preview.png (Bigger 432523)
       85460       64430  75% tape-preview.png
      146804      146804 100% tape-save1.png (Bigger 162252)
      106586      106586 100% tape-save2.png (Bigger 116692)
      111749      111749 100% tape-save3.png (Bigger 126154)
      112602      112602 100% tape-select.png (Bigger 122312)
       84875       62890  74% tape-tutorial.png
      523564      523564 100% verse1.png (Bigger 725701)
      529406      529406 100% verse2.png (Bigger 748539)
      387116      387116 100% verse3.png (Bigger 537302)
     2517255     2464120  97%
```

### cmake

- バイナリインストール
- https://cmake.org/download/

### mozjpegの実験

```
mkdir build
cd build
/Applications/CMake.app/Contents/bin/cmake -G"Unix Makefiles" -DCMAKE_PREFIX_PATH=/opt/dromozoa -DPNG_SUPPORTED=ON ..
make
```

- 品質85くらいで

```
% for i in source/*.*; do j=`basename "$i"`; j=`expr "X$j" : 'X\(.*\)\.[^.]*$'`; ../mozjpeg-4.1.1/build/cjpeg -quality 85 "$i" >"test/$j.jpg"; done
% du -shc source/*.jpg
120K	source/bg-landscape-kcode.jpg
312K	source/bg-landscape.jpg
128K	source/bg-portrait-kcode.jpg
296K	source/bg-portrait.jpg
160K	source/screen-shot1.jpg
160K	source/screen-shot2.jpg
160K	source/screen-shot3.jpg
164K	source/screen-shot4.jpg
1.5M	total
% du -shc test/bg-*.jpg test/screen-shot*.jpg
112K	test/bg-landscape-kcode.jpg
264K	test/bg-landscape.jpg
116K	test/bg-portrait-kcode.jpg
252K	test/bg-portrait.jpg
 76K	test/screen-shot1.jpg
 76K	test/screen-shot2.jpg
 72K	test/screen-shot3.jpg
 76K	test/screen-shot4.jpg
1.0M	total
```

