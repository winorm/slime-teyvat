import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SAMPLE_RATE = 11025
const TAU = Math.PI * 2
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = resolve(root, 'public', 'bgm')

const NOTE_OFFSETS = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

function midi(name) {
  const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(name)

  if (!match) {
    throw new Error(`Invalid note: ${name}`)
  }

  return (Number(match[2]) + 1) * 12 + NOTE_OFFSETS[match[1]]
}

function frequency(note) {
  return 440 * 2 ** ((note - 69) / 12)
}

function createBuffer(seconds) {
  return new Float64Array(Math.ceil(seconds * SAMPLE_RATE))
}

function makeNoise(seed = 0x9e3779b9) {
  let state = seed >>> 0

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0xffffffff * 2 - 1
  }
}

const waveform = {
  sine(phase) {
    return Math.sin(phase)
  },
  triangle(phase) {
    return (2 / Math.PI) * Math.asin(Math.sin(phase))
  },
  softSquare(phase) {
    return Math.tanh(Math.sin(phase) * 2.4)
  },
  softSaw(phase) {
    const wrapped = ((phase / TAU) % 1 + 1) % 1
    return Math.tanh((wrapped * 2 - 1) * 2)
  },
}

function addTone(
  buffer,
  beat,
  length,
  note,
  amp,
  {
    bpm,
    wave = 'sine',
    attack = 0.012,
    release = 0.12,
    decay = 0,
    vibrato = 0,
    detune = 0,
  }
) {
  const beatSeconds = 60 / bpm
  const start = Math.max(0, beat * beatSeconds)
  const duration = Math.max(0.03, length * beatSeconds)
  const startSample = Math.floor(start * SAMPLE_RATE)
  const sampleCount = Math.floor(duration * SAMPLE_RATE)
  const attackSamples = Math.max(1, Math.floor(attack * SAMPLE_RATE))
  const releaseSamples = Math.max(1, Math.floor(release * SAMPLE_RATE))
  const baseFrequency = frequency(note) * 2 ** (detune / 1200)
  const oscillator = waveform[wave]

  if (!oscillator) {
    throw new Error(`Unknown waveform: ${wave}`)
  }

  for (let index = 0; index < sampleCount; index++) {
    const target = startSample + index

    if (target >= buffer.length) {
      break
    }

    const time = index / SAMPLE_RATE
    const progress = index / sampleCount
    const attackGain = Math.min(1, index / attackSamples)
    const releaseGain = Math.min(1, (sampleCount - index) / releaseSamples)
    const decayGain = decay > 0 ? Math.exp(-decay * progress) : 1
    const vibratoPhase =
      vibrato > 0
        ? Math.sin(TAU * 5.2 * time) * vibrato
        : 0
    const phase =
      TAU * baseFrequency * time +
      vibratoPhase

    buffer[target] +=
      oscillator(phase) *
      amp *
      attackGain *
      releaseGain *
      decayGain
  }
}

function addKick(buffer, beat, bpm, amp = 0.65) {
  const start = Math.floor(beat * (60 / bpm) * SAMPLE_RATE)
  const samples = Math.floor(0.18 * SAMPLE_RATE)

  for (let index = 0; index < samples; index++) {
    const target = start + index

    if (target >= buffer.length) {
      break
    }

    const time = index / SAMPLE_RATE
    const progress = index / samples
    const pitch = 92 - progress * 58

    buffer[target] +=
      Math.sin(TAU * pitch * time) *
      amp *
      Math.exp(-6.5 * progress)
  }
}

function addWood(buffer, beat, bpm, amp = 0.22, brightness = 1) {
  const noise = makeNoise(Math.round(beat * 971 + bpm))
  const start = Math.floor(beat * (60 / bpm) * SAMPLE_RATE)
  const samples = Math.floor(0.09 * SAMPLE_RATE)

  for (let index = 0; index < samples; index++) {
    const target = start + index

    if (target >= buffer.length) {
      break
    }

    const time = index / SAMPLE_RATE
    const progress = index / samples
    const ring =
      Math.sin(TAU * (460 * brightness) * time) * 0.55 +
      Math.sin(TAU * (720 * brightness) * time) * 0.2

    buffer[target] +=
      (ring + noise() * 0.2) *
      amp *
      Math.exp(-12 * progress)
  }
}

function addSnare(buffer, beat, bpm, amp = 0.28) {
  const noise = makeNoise(Math.round(beat * 431 + bpm))
  const start = Math.floor(beat * (60 / bpm) * SAMPLE_RATE)
  const samples = Math.floor(0.12 * SAMPLE_RATE)
  let previous = 0

  for (let index = 0; index < samples; index++) {
    const target = start + index

    if (target >= buffer.length) {
      break
    }

    const progress = index / samples
    const raw = noise()
    const brightNoise = raw - previous * 0.65
    previous = raw

    buffer[target] +=
      brightNoise *
      amp *
      Math.exp(-9 * progress)
  }
}

function addCymbal(buffer, beat, bpm, amp = 0.12) {
  const noise = makeNoise(Math.round(beat * 1217 + bpm))
  const start = Math.floor(beat * (60 / bpm) * SAMPLE_RATE)
  const samples = Math.floor(0.9 * SAMPLE_RATE)
  let previous = 0

  for (let index = 0; index < samples; index++) {
    const target = start + index

    if (target >= buffer.length) {
      break
    }

    const progress = index / samples
    const raw = noise()
    const high = raw - previous
    previous = raw

    buffer[target] +=
      high *
      amp *
      Math.exp(-4.2 * progress)
  }
}

function addPadChord(buffer, beat, length, notes, bpm, amp = 0.045) {
  notes.forEach((note, index) => {
    addTone(buffer, beat, length, note, amp, {
      bpm,
      wave: index % 2 === 0 ? 'triangle' : 'sine',
      attack: 0.55,
      release: 0.7,
      vibrato: 0.035,
      detune: index % 2 === 0 ? -4 : 4,
    })
  })
}

function addPluck(buffer, beat, length, note, bpm, amp = 0.12) {
  addTone(buffer, beat, length, note, amp, {
    bpm,
    wave: 'triangle',
    attack: 0.008,
    release: 0.16,
    decay: 4.2,
  })
  addTone(buffer, beat, length, note + 12, amp * 0.16, {
    bpm,
    wave: 'sine',
    attack: 0.004,
    release: 0.12,
    decay: 6,
  })
}

function addBass(buffer, beat, length, note, bpm, amp = 0.12) {
  addTone(buffer, beat, length, note, amp, {
    bpm,
    wave: 'triangle',
    attack: 0.018,
    release: 0.12,
    decay: 1.1,
  })
}

function addBrass(buffer, beat, length, notes, bpm, amp = 0.09) {
  notes.forEach((note) => {
    addTone(buffer, beat, length, note, amp, {
      bpm,
      wave: 'softSaw',
      attack: 0.025,
      release: 0.15,
      decay: 1.4,
      detune: -5,
    })
    addTone(buffer, beat, length, note, amp * 0.45, {
      bpm,
      wave: 'softSquare',
      attack: 0.02,
      release: 0.15,
      decay: 1.8,
      detune: 5,
    })
  })
}

function finalize(buffer, peak = 0.72) {
  let maximum = 0

  for (const value of buffer) {
    maximum = Math.max(maximum, Math.abs(value))
  }

  const gain = maximum > 0 ? peak / maximum : 1

  for (let index = 0; index < buffer.length; index++) {
    const edge = Math.min(
      1,
      index / Math.floor(0.012 * SAMPLE_RATE),
      (buffer.length - index) / Math.floor(0.012 * SAMPLE_RATE)
    )

    buffer[index] = Math.tanh(buffer[index] * gain * 1.08) * edge
  }

  return buffer
}

function writeWav(path, samples) {
  const dataBytes = samples.length * 2
  const buffer = Buffer.alloc(44 + dataBytes)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataBytes, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataBytes, 40)

  for (let index = 0; index < samples.length; index++) {
    const value = Math.max(-1, Math.min(1, samples[index]))
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2)
  }

  writeFileSync(path, buffer)
}

function makeLiyue() {
  const bpm = 92
  const beats = 32
  const buffer = createBuffer(beats * 60 / bpm)
  const chords = [
    ['D3', 'F3', 'A3'],
    ['B2', 'D3', 'F3'],
    ['G2', 'B2', 'D3'],
    ['A2', 'C#3', 'E3'],
  ]
  const melody = [
    ['D5', 0, 1], ['E5', 1, 1], ['F#5', 2, 1.5], ['A5', 3.5, 0.5],
    ['F#5', 4, 1], ['E5', 5, 1], ['D5', 6, 2],
    ['B4', 8, 1], ['D5', 9, 1], ['E5', 10, 1.5], ['F#5', 11.5, 0.5],
    ['E5', 12, 1], ['D5', 13, 1], ['B4', 14, 2],
    ['G4', 16, 1], ['B4', 17, 1], ['D5', 18, 1.5], ['E5', 19.5, 0.5],
    ['D5', 20, 1], ['B4', 21, 1], ['A4', 22, 2],
    ['A4', 24, 1], ['C#5', 25, 1], ['E5', 26, 1.5], ['F#5', 27.5, 0.5],
    ['E5', 28, 1], ['C#5', 29, 1], ['A4', 30, 2],
  ]

  chords.forEach((chord, index) => {
    const start = index * 8
    addPadChord(buffer, start, 8, chord.map(midi), bpm, 0.036)
  })

  melody.forEach(([note, beat, length]) => {
    addPluck(buffer, beat, length, midi(note), bpm, 0.095)
  })

  for (let beat = 0; beat < beats; beat += 2) {
    const root = ['D2', 'B1', 'G1', 'A1'][Math.floor(beat / 8)]
    addBass(buffer, beat, 1.7, midi(root), bpm, 0.09)
  }

  for (let beat = 0; beat < beats; beat += 1) {
    addWood(buffer, beat, bpm, beat % 4 === 0 ? 0.13 : 0.07, beat % 4 === 0 ? 0.8 : 1.2)
  }

  for (let beat = 8; beat < beats; beat += 8) {
    addCymbal(buffer, beat, bpm, 0.035)
  }

  return finalize(buffer, 0.68)
}

function makeGoldenHouse() {
  const bpm = 136
  const beats = 32
  const buffer = createBuffer(beats * 60 / bpm)
  const chords = [
    ['D3', 'F3', 'A3'],
    ['Bb2', 'D3', 'F3'],
    ['G2', 'Bb2', 'D3'],
    ['A2', 'C#3', 'E3'],
  ]

  for (let beat = 0; beat < beats; beat += 8) {
    const chord = chords[Math.floor(beat / 8)]
    addPadChord(buffer, beat, 8, chord.map(midi), bpm, 0.028)
    addBrass(buffer, beat, 0.8, chord.map((note) => midi(note) + 12), bpm, 0.08)
    addBrass(buffer, beat + 3.5, 0.45, chord.slice(0, 2).map((note) => midi(note) + 12), bpm, 0.055)
  }

  const bassPattern = [0, 0, 7, 0, 3, 0, 7, 0]
  const roots = ['D2', 'Bb1', 'G1', 'A1']

  for (let beat = 0; beat < beats; beat += 1) {
    const section = Math.floor(beat / 8)
    const offset = bassPattern[beat % 8]
    addBass(buffer, beat, 0.72, midi(roots[section]) + offset, bpm, 0.105)
  }

  const ostinato = ['D5', 'A4', 'F4', 'A4']

  for (let beat = 0; beat < beats; beat += 0.5) {
    const note = ostinato[Math.round(beat * 2) % ostinato.length]
    addPluck(buffer, beat, 0.42, midi(note), bpm, 0.042)
  }

  const lead = [
    ['A4', 0, 1], ['D5', 1, 1], ['F5', 2, 1], ['E5', 3, 1],
    ['D5', 4, 2], ['C#5', 6, 1.5],
    ['F5', 8, 1], ['E5', 9, 1], ['D5', 10, 1], ['C5', 11, 1],
    ['Bb4', 12, 2], ['A4', 14, 1.5],
    ['Bb4', 16, 1], ['D5', 17, 1], ['G5', 18, 1], ['F5', 19, 1],
    ['D5', 20, 2], ['C5', 22, 1.5],
    ['C#5', 24, 1], ['E5', 25, 1], ['A5', 26, 1], ['G5', 27, 1],
    ['E5', 28, 1], ['C#5', 29, 1], ['A4', 30, 2],
  ]

  lead.forEach(([note, beat, length]) => {
    addTone(buffer, beat, length, midi(note), 0.075, {
      bpm,
      wave: 'softSaw',
      attack: 0.018,
      release: 0.18,
      decay: 1.1,
      detune: -3,
    })
    addTone(buffer, beat, length, midi(note), 0.035, {
      bpm,
      wave: 'softSquare',
      attack: 0.02,
      release: 0.18,
      decay: 1.5,
      detune: 4,
    })
  })

  for (let beat = 0; beat < beats; beat += 1) {
    addKick(buffer, beat, bpm, 0.45)

    if (beat % 4 === 1 || beat % 4 === 3) {
      addSnare(buffer, beat, bpm, 0.2)
    }

    if (beat % 8 === 7.5) {
      addSnare(buffer, beat, bpm, 0.14)
    }
  }

  ;[0, 8, 16, 24].forEach((beat) => addCymbal(buffer, beat, bpm, 0.075))
  addCymbal(buffer, 31.5, bpm, 0.08)

  return finalize(buffer, 0.76)
}

function makeOsial() {
  const bpm = 152
  const beats = 32
  const buffer = createBuffer(beats * 60 / bpm)

  for (let beat = 0; beat < beats; beat += 8) {
    addPadChord(buffer, beat, 8, [midi('D3'), midi('Ab3'), midi('D4')], bpm, 0.032)
    addBass(buffer, beat, 7.5, midi('D1'), bpm, 0.12)
  }

  const pulse = ['D4', 'F4', 'Ab4', 'C#5', 'D5', 'C#5', 'Ab4', 'F4']

  for (let beat = 0; beat < beats; beat += 0.5) {
    const step = Math.round(beat * 2)
    addPluck(buffer, beat, 0.38, midi(pulse[step % pulse.length]), bpm, 0.045)
  }

  const horns = [
    ['D4', 'F4', 'Ab4'],
    ['Bb3', 'D4', 'F4'],
    ['G3', 'Bb3', 'D4'],
    ['Ab3', 'C4', 'Eb4'],
  ]

  for (let beat = 0; beat < beats; beat += 4) {
    const chord = horns[Math.floor(beat / 8) % horns.length]
    addBrass(buffer, beat, 0.65, chord.map(midi), bpm, 0.09)
    addBrass(buffer, beat + 2.5, 0.35, chord.slice(0, 2).map(midi), bpm, 0.06)
  }

  const lead = [
    ['D5', 0, 2], ['Ab4', 2, 1], ['F4', 3, 1],
    ['Bb4', 4, 2], ['D5', 6, 1.5],
    ['F5', 8, 1], ['Eb5', 9, 1], ['D5', 10, 1], ['Bb4', 11, 1],
    ['Ab4', 12, 2], ['G4', 14, 1.5],
    ['D5', 16, 1], ['F5', 17, 1], ['Ab5', 18, 1], ['G5', 19, 1],
    ['F5', 20, 2], ['Eb5', 22, 1.5],
    ['D5', 24, 1], ['C#5', 25, 1], ['D5', 26, 1], ['F5', 27, 1],
    ['Ab5', 28, 2], ['F5', 30, 2],
  ]

  lead.forEach(([note, beat, length]) => {
    addTone(buffer, beat, length, midi(note), 0.07, {
      bpm,
      wave: 'softSaw',
      attack: 0.025,
      release: 0.22,
      decay: 1.35,
      detune: -7,
      vibrato: 0.05,
    })
  })

  for (let beat = 0; beat < beats; beat += 1) {
    addKick(buffer, beat, bpm, beat % 2 === 0 ? 0.48 : 0.3)
  }

  for (let beat = 1; beat < beats; beat += 2) {
    addWood(buffer, beat, bpm, 0.12, 0.55)
  }

  for (let beat = 7.5; beat < beats; beat += 8) {
    addSnare(buffer, beat, bpm, 0.2)
  }

  ;[0, 8, 16, 24, 31.5].forEach((beat) => addCymbal(buffer, beat, bpm, 0.055))

  return finalize(buffer, 0.78)
}

function addBell(buffer, beat, length, note, bpm, amp = 0.08) {
  const base = midi(note)
  const partials = [
    [0, 1, 1],
    [12, 0.38, 0.72],
    [19, 0.2, 0.48],
    [24, 0.12, 0.36],
  ]

  partials.forEach(([offset, volume, decay]) => {
    addTone(buffer, beat, length, base + offset, amp * volume, {
      bpm,
      wave: 'sine',
      attack: 0.006,
      release: Math.min(0.45, 60 / bpm * length * 0.68),
      decay: 3.8 / decay,
    })
  })
}

function makeWindLand() {
  const bpm = 108
  const beats = 32
  const buffer = createBuffer(beats * 60 / bpm)
  const chords = [
    ['C3', 'E3', 'G3'],
    ['A2', 'C3', 'E3'],
    ['F2', 'A2', 'C3'],
    ['G2', 'B2', 'D3'],
  ]
  const melody = [
    ['G4', 0, 1], ['C5', 1, 1], ['D5', 2, 1.5], ['E5', 3.5, 0.5],
    ['D5', 4, 1], ['C5', 5, 1], ['A4', 6, 2],
    ['E4', 8, 1], ['G4', 9, 1], ['A4', 10, 1.5], ['C5', 11.5, 0.5],
    ['A4', 12, 1], ['G4', 13, 1], ['E4', 14, 2],
    ['F4', 16, 1], ['A4', 17, 1], ['C5', 18, 1.5], ['D5', 19.5, 0.5],
    ['C5', 20, 1], ['A4', 21, 1], ['G4', 22, 2],
    ['G4', 24, 1], ['B4', 25, 1], ['D5', 26, 1.5], ['G5', 27.5, 0.5],
    ['E5', 28, 1], ['D5', 29, 1], ['B4', 30, 2],
  ]

  chords.forEach((chord, index) => {
    addPadChord(buffer, index * 8, 8, chord.map(midi), bpm, 0.031)
  })

  melody.forEach(([note, beat, length]) => {
    addPluck(buffer, beat, length, midi(note), bpm, 0.082)
    addTone(buffer, beat, length, midi(note) + 12, 0.018, {
      bpm,
      wave: 'sine',
      attack: 0.012,
      release: 0.14,
      decay: 2.2,
      vibrato: 0.022,
    })
  })

  for (let beat = 0; beat < beats; beat += 2) {
    addBass(buffer, beat, 1.7, midi(chords[Math.floor(beat / 8)][0]), bpm, 0.075)
  }

  for (let beat = 0; beat < beats; beat += 2) {
    addWood(buffer, beat + 0.5, bpm, beat % 8 === 0 ? 0.065 : 0.04, 1.25)
  }

  return finalize(buffer, 0.65)
}

function makeHarbor() {
  const bpm = 112
  const beats = 32
  const buffer = createBuffer(beats * 60 / bpm)
  const chords = [
    ['G2', 'B2', 'D3'],
    ['E2', 'G2', 'B2'],
    ['C3', 'E3', 'G3'],
    ['D3', 'F#3', 'A3'],
  ]
  const melody = [
    ['D5', 0, 0.75], ['E5', 0.75, 0.75], ['G5', 1.5, 1.25], ['B4', 3, 1],
    ['D5', 4, 0.75], ['E5', 4.75, 0.75], ['A5', 5.5, 1.25], ['G5', 7, 1],
    ['E5', 8, 0.75], ['G5', 8.75, 0.75], ['B5', 9.5, 1.25], ['A5', 11, 1],
    ['G5', 12, 0.75], ['E5', 12.75, 0.75], ['D5', 13.5, 1.25], ['B4', 15, 1],
    ['G4', 16, 0.75], ['B4', 16.75, 0.75], ['D5', 17.5, 1.25], ['E5', 19, 1],
    ['G5', 20, 0.75], ['E5', 20.75, 0.75], ['D5', 21.5, 1.25], ['B4', 23, 1],
    ['A4', 24, 0.75], ['B4', 24.75, 0.75], ['D5', 25.5, 1.25], ['E5', 27, 1],
    ['G5', 28, 0.75], ['F#5', 28.75, 0.75], ['E5', 29.5, 1.25], ['D5', 31, 1],
  ]

  chords.forEach((chord, index) => {
    addPadChord(buffer, index * 8, 8, chord.map(midi), bpm, 0.025)
  })

  melody.forEach(([note, beat, length]) => {
    addPluck(buffer, beat, length, midi(note), bpm, 0.095)
  })

  for (let beat = 0; beat < beats; beat += 0.5) {
    const chord = chords[Math.floor(beat / 8)]
    const note = midi(chord[beat % 2 === 0 ? 0 : 1]) + (beat % 4 >= 2 ? 12 : 0)
    addBass(buffer, beat, 0.42, note, bpm, 0.055)
  }

  for (let beat = 0; beat < beats; beat += 1) {
    addWood(buffer, beat, bpm, beat % 4 === 0 ? 0.12 : 0.055, beat % 4 === 0 ? 0.75 : 1.35)
  }

  for (let beat = 7.5; beat < beats; beat += 8) {
    addSnare(buffer, beat, bpm, 0.09)
  }

  return finalize(buffer, 0.7)
}

function makeMountain() {
  const bpm = 84
  const beats = 32
  const buffer = createBuffer(beats * 60 / bpm)
  const melody = [
    ['D4', 0, 2], ['F4', 2, 1], ['G4', 3, 1],
    ['A4', 4, 2.5], ['G4', 6.5, 1.5],
    ['F4', 8, 2], ['D4', 10, 1], ['C4', 11, 1],
    ['A3', 12, 3], ['C4', 15, 1],
    ['D4', 16, 2], ['F4', 18, 1], ['A4', 19, 1],
    ['C5', 20, 2.5], ['A4', 22.5, 1.5],
    ['G4', 24, 2], ['F4', 26, 1], ['D4', 27, 1],
    ['C4', 28, 1.5], ['D4', 29.5, 2.5],
  ]

  ;[
    ['D3', 'F3', 'A3'],
    ['Bb2', 'D3', 'F3'],
    ['G2', 'Bb2', 'D3'],
    ['A2', 'C#3', 'E3'],
  ].forEach((chord, index) => {
    addPadChord(buffer, index * 8, 8, chord.map(midi), bpm, 0.032)
  })

  melody.forEach(([note, beat, length]) => {
    addBell(buffer, beat, Math.min(length, 2.2), note, bpm, 0.075)
    addPluck(buffer, beat, length, midi(note), bpm, 0.035)
  })

  for (let beat = 0; beat < beats; beat += 4) {
    addBass(buffer, beat, 3.7, midi(beat < 16 ? 'D2' : 'G2'), bpm, 0.085)
  }

  for (let beat = 0; beat < beats; beat += 2) {
    addWood(buffer, beat, bpm, 0.045, 0.65)
  }

  return finalize(buffer, 0.62)
}

function makeTrial() {
  const bpm = 96
  const beats = 32
  const buffer = createBuffer(beats * 60 / bpm)
  const bells = [
    ['E5', 0], ['B4', 0.75], ['G5', 1.5], ['F#5', 2.25],
    ['E5', 4], ['D5', 4.75], ['B4', 5.5], ['G4', 6.25],
    ['C5', 8], ['G4', 8.75], ['A4', 9.5], ['B4', 10.25],
    ['E5', 12], ['D5', 12.75], ['B4', 13.5], ['A4', 14.25],
    ['G4', 16], ['B4', 16.75], ['D5', 17.5], ['E5', 18.25],
    ['G5', 20], ['F#5', 20.75], ['D5', 21.5], ['B4', 22.25],
    ['A4', 24], ['C5', 24.75], ['E5', 25.5], ['D5', 26.25],
    ['B4', 28], ['A4', 28.75], ['G4', 29.5], ['B4', 30.25],
  ]

  ;[
    ['E3', 'G3', 'B3'],
    ['C3', 'E3', 'G3'],
    ['G2', 'B2', 'D3'],
    ['D3', 'F#3', 'A3'],
  ].forEach((chord, index) => {
    addPadChord(buffer, index * 8, 8, chord.map(midi), bpm, 0.038)
  })

  bells.forEach(([note, beat]) => {
    addBell(buffer, beat, 1.6, note, bpm, 0.07)
  })

  for (let beat = 0; beat < beats; beat += 4) {
    addBass(buffer, beat, 3.8, midi('E2'), bpm, 0.07)
  }

  for (let beat = 0; beat < beats; beat += 1) {
    addTone(buffer, beat, 0.8, midi('E3'), 0.018, {
      bpm,
      wave: 'sine',
      attack: 0.08,
      release: 0.3,
      vibrato: 0.05,
    })
  }

  return finalize(buffer, 0.58)
}

function makeRite() {
  const bpm = 72
  const beats = 32
  const buffer = createBuffer(beats * 60 / bpm)
  const melody = [
    ['D4', 0, 2], ['A3', 2, 2], ['C4', 4, 1.5], ['D4', 5.5, 2.5],
    ['F4', 8, 2], ['E4', 10, 1], ['D4', 11, 3],
    ['A3', 14, 2],
    ['Bb3', 16, 2], ['D4', 18, 2], ['C4', 20, 1.5], ['A3', 21.5, 2.5],
    ['G3', 24, 2], ['A3', 26, 2], ['D4', 28, 4],
  ]

  ;[
    ['D3', 'F3', 'A3'],
    ['D3', 'G3', 'A3'],
    ['Bb2', 'D3', 'F3'],
    ['G2', 'Bb2', 'D3'],
  ].forEach((chord, index) => {
    addPadChord(buffer, index * 8, 8, chord.map(midi), bpm, 0.037)
  })

  melody.forEach(([note, beat, length]) => {
    addBell(buffer, beat, Math.min(length, 3), note, bpm, 0.065)
    addTone(buffer, beat, length, midi(note) - 12, 0.045, {
      bpm,
      wave: 'triangle',
      attack: 0.12,
      release: 0.45,
      vibrato: 0.025,
    })
  })

  for (let beat = 0; beat < beats; beat += 8) {
    addBass(buffer, beat, 7.5, midi('D1'), bpm, 0.095)
    addCymbal(buffer, beat, bpm, 0.025)
  }

  for (let beat = 4; beat < beats; beat += 8) {
    addWood(buffer, beat, bpm, 0.07, 0.45)
    addWood(buffer, beat + 1.5, bpm, 0.035, 0.52)
  }

  return finalize(buffer, 0.62)
}

mkdirSync(outputDir, { recursive: true })
writeWav(resolve(outputDir, 'wind-land.wav'), makeWindLand())
writeWav(resolve(outputDir, 'liyue.wav'), makeLiyue())
writeWav(resolve(outputDir, 'harbor.wav'), makeHarbor())
writeWav(resolve(outputDir, 'mountain.wav'), makeMountain())
writeWav(resolve(outputDir, 'trial.wav'), makeTrial())
writeWav(resolve(outputDir, 'rite.wav'), makeRite())
writeWav(resolve(outputDir, 'golden-house.wav'), makeGoldenHouse())
writeWav(resolve(outputDir, 'osial.wav'), makeOsial())

console.log('Generated all project music loops')
