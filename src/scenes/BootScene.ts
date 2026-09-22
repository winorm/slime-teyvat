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
    slimeGfx.fillRoundedRect(0, 0, 32, 26, 10)
    slimeGfx.generateTexture('slime', 32, 26)
    slimeGfx.destroy()

    const orbGfx = this.add.graphics()
    orbGfx.fillStyle(0xffffff, 1)
    orbGfx.fillCircle(7, 7, 7)
    orbGfx.generateTexture('orb', 14, 14)
    orbGfx.destroy()

    const goalGfx = this.add.graphics()
    goalGfx.fillStyle(0xffffff, 1)
    goalGfx.fillRoundedRect(0, 0, 24, 24, 6)
    goalGfx.generateTexture('goal', 24, 24)
    goalGfx.destroy()
    
    const statueGfx = this.add.graphics()
    statueGfx.fillStyle(0xffffff, 1)
    statueGfx.fillRect(0, 40, 32, 8)
    statueGfx.fillRoundedRect(6, 16, 20, 26, 6)
    statueGfx.fillCircle(16, 12, 10)
    statueGfx.generateTexture('statue', 32, 48)
    statueGfx.destroy()
  }
}