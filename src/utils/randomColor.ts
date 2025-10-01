// 配置参数
const config = {
    saturationRange: [40, 85],
    lightnessRange: [70, 85],
    autoGenerateInterval: null
};

// 生成随机颜色函数（基于分析规律）
export function getRandomColor() {
    // 随机色相（0-360）
    const hue = Math.floor(Math.random() * 361);

    // 在配置范围内随机饱和度
    const saturation = Math.floor(
        config.saturationRange[0] +
        Math.random() * (config.saturationRange[1] - config.saturationRange[0])
    );

    // 在配置范围内随机亮度
    const lightness = Math.floor(
        config.lightnessRange[0] +
        Math.random() * (config.lightnessRange[1] - config.lightnessRange[0])
    );

    return {
        hsl: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        hex: hslToHex(hue, saturation, lightness)
    };
}

// HSL转Hex辅助函数
function hslToHex(h: number, s: number, l: number) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // 灰度
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


export const colors = [
    "#fed886",
    "#ee7a80",
    "#abd5b7",
    "#8bdaab",
    "#f495ae",
    "#faad14",
    "#13c2c2",
    "#8f88f2",
    "#ee9f8b",
    "#e6e499"
]