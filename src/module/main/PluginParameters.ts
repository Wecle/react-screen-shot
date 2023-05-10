// 数据初始化标识
let initStatus = false;

// 画布高宽
let canvasWidth = 0;
let canvasHeight = 0;

// 蒙层颜色
const maskColor = { r: 0, g: 0, b: 0, a: 0.6 };

export default class PluginParameters
{
	constructor()
	{
		if (initStatus)
		{
			canvasWidth = 0;
			canvasHeight = 0;

			initStatus = false;
		}
	}

	// 设置初始状态
	public setInitStatus(status: boolean)
	{
		initStatus = status;
	}

	// 返回初始状态
	public getInitStatus()
	{
		return initStatus
	}

	// 设置画布大小
	public setCanvasSize(width: number, height: number)
	{
		canvasWidth = width;
		canvasHeight = height;
	}

	// 获取画布宽高
	public getCanvasSize()
	{
		return { canvasWidth, canvasHeight };
	}

	// 设置蒙层颜色
	public setMaskColor(color: { r: number; g: number; b: number; a: number })
	{
		maskColor.r = color.r;
		maskColor.g = color.g;
		maskColor.b = color.b;
		maskColor.a = color.a;
	}

	public getMaskColor()
	{
		return maskColor;
	}
}
