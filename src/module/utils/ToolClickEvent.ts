import { getCanvasImgData } from "../common/GetCanvasImgData";
import { setSelectedClassName } from "../common/SetSelectedClassName";
import InitData from "../main/InitData";
import { drawCutOutBox } from "./DrawCutOutBox";

/**
 * 裁剪框工具栏点击事件
 * @param toolName
 * @param index
 * @param mouseEvent
 */
export function toolClickEvent(
	toolName: string,
	index: number,
	mouseEvent: any,
	completeCallback: Function | undefined,
	closeCallback: Function | undefined
)
{
	const data = new InitData();
	const screenShotController = data.getScreenShotContainer();
	const ScreenShotImageController = data.getScreenShotImageController();
	data.setActiveToolName(toolName);
	if (screenShotController == null || ScreenShotImageController == null) return;
	// 获取canvas容器
	const screenShotCanvas = screenShotController.getContext(
		"2d"
	) as CanvasRenderingContext2D;
	// 工具栏尚未点击，当前属于首次点击，重新绘制一个无像素点的裁剪框
	if (!data.getToolClickStatus())
	{
		const leftValue = data.getToolPosition()?.left || 0;
		const topValue = data.getToolPosition()?.top || 0;
		// 工具栏位置超出时，对其进行修正处理
		if (topValue && data.getToolPositionStatus())
		{
			// 调整工具栏位置
			data.setToolInfo(leftValue, topValue - 46);
		}
		data.setToolStatus(true);
		// 获取裁剪框位置信息
		const cutBoxPosition = data.getCutOutBoxPosition();
		// 开始绘制无像素点裁剪框
		drawCutOutBox(
			cutBoxPosition.startX,
			cutBoxPosition.startY,
			cutBoxPosition.width,
			cutBoxPosition.height,
			screenShotCanvas,
			data.getBorderSize(),
			screenShotController as HTMLCanvasElement,
			ScreenShotImageController,
			false
		);
	}
	// 更新当前点击的工具栏条目
	data.setToolName(toolName);
	// 为当前点击项添加选中时的class名
	setSelectedClassName(mouseEvent, index, false);
	data.setRightPanel(true);
	// 初始化点击状态
	data.setDragging(false);
	data.setDraggingTrim(false);

	// 保存图片
	if (toolName == "save")
	{
		getCanvasImgData(true);
		// 销毁组件
		data.destroyDOM();
		data.setInitStatus(true);
	}
	// 销毁组件
	if (toolName == "close")
	{
		// 触发关闭回调函数
		if (closeCallback)
		{
			closeCallback();
		}
		data.destroyDOM();
		data.setInitStatus(true);
	}
	// 确认截图
	if (toolName == "confirm")
	{
		const base64 = getCanvasImgData(false);
		// 触发回调函数，截图数据回传给插件调用者
		if (completeCallback)
		{
			completeCallback(base64);
		}
		// 销毁组件
		data.destroyDOM();
		data.setInitStatus(true);
	}

	// 设置裁剪框工具栏为点击状态
	data.setToolClickStatus(true);
}
