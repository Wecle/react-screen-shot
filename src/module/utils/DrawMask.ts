import PluginParameters from "../main/PluginParameters";

export function drawMask(context: CanvasRenderingContext2D, imgData?: HTMLCanvasElement)
{
	const data = new PluginParameters()
	const pluginParameters = new PluginParameters()
	const canvasSize = pluginParameters.getCanvasSize()
	const viewSize = {
		width: parseFloat(window.getComputedStyle(document.body).width),
		height: parseFloat(window.getComputedStyle(document.body).height)
	};
	const maxWidth = Math.max(
		viewSize.width || 0,
		Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
		Math.max(document.body.offsetWidth, document.documentElement.offsetWidth),
		Math.max(document.body.clientWidth, document.documentElement.clientWidth)
	);
	const maxHeight = Math.max(
		viewSize.height || 0,
		Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
		Math.max(document.body.offsetHeight, document.documentElement.offsetHeight),
		Math.max(document.body.clientHeight, document.documentElement.clientHeight)
	);
	// 清除画布
	context.clearRect(0, 0, maxWidth, maxHeight);

	// 绘制蒙层
	context.save();
	const maskColor = data.getMaskColor();
	context.fillStyle = "rgba(0, 0, 0, .6)";
	if (maskColor)
	{
		context.fillStyle = `rgba(${maskColor.r}, ${maskColor.g}, ${maskColor.b}, ${maskColor.a})`;
	}
	if (canvasSize.canvasWidth !== 0 && canvasSize.canvasHeight !== 0)
	{
		context.fillRect(0, 0, canvasSize.canvasWidth, canvasSize.canvasHeight);
	} else
	{
		context.fillRect(0, 0, maxWidth, maxHeight);
	}
	// 绘制结束
	context.restore();
}
