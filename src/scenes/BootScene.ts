import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  create() {
    this.makeTextures()
    this.scene.start('menu')
  }

  private makeTextures() {
    const pixelGfx = this.add.graphics()
    pixelGfx.fillStyle(0xffffff, 1)
    pixelGfx.fillRect(0, 0, 1, 1)
    pixelGfx.generateTexture('pixel', 1, 1)
    pixelGfx.destroy()

    const slimeGfx = this.add.graphics()
    slimeGfx.fillStyle(0xffffff, 1)
    slimeGfx.fillRoundedRect(0, 0, 64, 52, 20)
    slimeGfx.generateTexture('slime', 64, 52)
    slimeGfx.destroy()

    const orbGfx = this.add.graphics()
    orbGfx.fillStyle(0xffffff, 1)
    orbGfx.fillCircle(14, 14, 14)
    orbGfx.generateTexture('orb', 28, 28)
    orbGfx.destroy()

    const goalGfx = this.add.graphics()
    goalGfx.fillStyle(0xffffff, 1)
    goalGfx.fillRoundedRect(0, 0, 48, 48, 12)
    goalGfx.generateTexture('goal', 48, 48)
    goalGfx.destroy()
  }
}