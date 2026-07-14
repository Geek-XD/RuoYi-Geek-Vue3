// 处理主题样式
export function handleThemeStyle(theme: string) {
	document.documentElement.style.setProperty('--el-color-primary', theme)
	for (let i = 1; i <= 9; i++) {
		document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, `${getLightColor(theme, i / 10)}`)
	}
	for (let i = 1; i <= 9; i++) {
		document.documentElement.style.setProperty(`--el-color-primary-dark-${i}`, `${getDarkColor(theme, i / 10)}`)
	}
}

// hex颜色转rgb颜色
export function hexToRgb(hex: string): number[] {
	hex = hex.replace(/^#/, '')
	if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
	if (hex.length !== 6) throw new Error('Invalid hex color')
	const r = parseInt(hex.slice(0, 2), 16)
	const g = parseInt(hex.slice(2, 4), 16)
	const b = parseInt(hex.slice(4, 6), 16)
	if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error('Invalid hex color')
	return [r, g, b]
}

// rgb颜色转Hex颜色
export function rgbToHex(r: number, g: number, b: number, toUpper = false) {
	const constrain = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
	const R = constrain(r)
	const G = constrain(g)
	const B = constrain(b)
	const hexR = R.toString(16).padStart(2, '0')
	const hexG = G.toString(16).padStart(2, '0')
	const hexB = B.toString(16).padStart(2, '0')
	const hex = `#${hexR}${hexG}${hexB}`
	return toUpper ? hex.toUpperCase() : hex
}

// 变浅颜色值
export function getLightColor(color: string, level: number) {
	let rgb = hexToRgb(color)
	for (let i = 0; i < 3; i++) {
		rgb[i] = Math.floor((255 - rgb[i]) * level + rgb[i])
	}
	return rgbToHex(rgb[0], rgb[1], rgb[2])
}

// 变深颜色值
export function getDarkColor(color: string, level: number) {
	let rgb = hexToRgb(color)
	for (let i = 0; i < 3; i++) {
		rgb[i] = Math.floor(rgb[i] * (1 - level))
	}
	return rgbToHex(rgb[0], rgb[1], rgb[2])
}
