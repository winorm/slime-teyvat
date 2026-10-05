# 第三方资源声明

这个仓库里除了作者自己写的东西，还用到了下面这些第三方资源。
打包出来的 `dist/` 和单文件 `game.html` 里都包含了它们，所以在这里一并声明。

## 引擎

**Phaser 4**（4.2.1）—— https://phaser.io

```
MIT License
Copyright (c) 2013-2025 Richard Davey, Photon Storm Ltd.
```

构建时的压缩会把 Phaser 的许可证注释一起去掉（我核对过：产物里搜不到 "MIT License" 字样），
所以这条声明请保留在本文件里，不要删。

## 音频

| 文件 | 来源 | 授权 |
|---|---|---|
| `sfx/jump.ogg` `sfx/land.ogg` `sfx/gem.ogg` `sfx/interact.ogg` `sfx/win.ogg` `sfx/die.ogg` | Kenney 的 Interface Sounds / Impact Sounds / Music Jingles 素材包（https://kenney.nl） | CC0 1.0，公共领域，可商用、无需署名 |
| `sfx/fly.wav` `sfx/glide.wav` `sfx/step.wav` | 本项目用脚本合成 | 同本仓库 LICENSE |
| `bgm/*.wav`（4 首） | 本项目用脚本合成（方波 / 三角波 / 噪声鼓点） | 同上 |

每个音效的原始文件名、生成参数和用途记在 `public/sfx/来源.txt` 与 `public/bgm/来源.txt` 里。

## 开发依赖（不随游戏分发）

TypeScript、Vite 只用于开发与构建，不会被打包进游戏，因此不需要在发行物里声明。

## 题材

游戏用到了《原神》的世界观名词（提瓦特、望舒客栈、七神赐予元素等）。
这些名称与设定的版权属于米哈游，本项目是非官方的同人习作，详见 README 的「同人声明」。
