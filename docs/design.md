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

## 画像最適化

- PNGはImageMagickでじゅうぶん
  - `-quality 90 -strip`
- JPEGは最終段でmozjpegで出力

### advancecompの実験

- [advancecomp](https://www.advancemame.it/)
- 得意なファイルと不得意なファイルがわかれる
- ImageMagickを通したあとにかけてもよい、くらい。
- もとの圧縮がわるいときはよくなる

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
/Applications/CMake.app/Contents/bin/cmake -G"Unix Makefiles" -DCMAKE_PREFIX_PATH=/opt/dromozoa -DPNG_SUPPORTED=ON -DCMAKE_INSTALL_PREFIX=/opt/mozjpeg-4.1.1 ..
make
make install
```

- 品質85くらいで

```
% for i in source/*.*; do j=`basename "$i"`; j=`expr "X$j" : 'X\(.*\)\.[^.]*$'`; cjpeg -quality 85 "$i" >"test/$j.jpg"; done
% du -sh source test
1.5M	source
1.0M	test
```

