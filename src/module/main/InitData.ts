import { getToolRelativePosition } from "../common/GetToolRelativePosition";
import PluginParameters from "./PluginParameters";

let initStatus = false;
let screenShotController: HTMLCanvasElement | null = null;
// 屏幕截图容器
let screenShotImageController: HTMLCanvasElement | null = null;
// 获取截图工具栏容器dom
let toolController: HTMLDivElement | null = null;
let cutBoxSizeContainer: HTMLDivElement | null = null;

// 裁剪框修剪状态
let draggingTrim = false;
// 裁剪框拖拽状态
let dragging = false;

// 裁剪框顶点边框直径大小
const borderSize = 10;

// 裁剪框位置参数
const cutOutBoxPosition: { startX: number; startY: number; width: number; height: number; } = {
	startX: 0,
	startY: 0,
	width: 0,
	height: 0
};

// 工具栏超出截图容器状态
let toolPositionStatus = false;

// 截图工具栏点击状态
let toolClickStatus = false;

// 当前点击的工具栏名称
let toolName = "";
// 当前工具栏内选中的工具
let activeTool = "";

let rightPanel: HTMLElement | null = null;

export default class InitData
{
	constructor()
	{
		if (initStatus)
		{
			initStatus = false;
			screenShotController = null;
			toolController = null;
			cutBoxSizeContainer = null;
			toolClickStatus = false;
			toolPositionStatus = false;
			toolName = "";
		}
	}

	// 设置数据初始化标识
	public setInitStatus(status: boolean)
	{
		initStatus = status;
	}

	// 显示截图区域容器
	public showScreenShotPanel()
	{
		this.getScreenShotContainer();
		if (screenShotController == null) return;
		screenShotController.style.display = "block";
	}

	// 获取截图容器dom
	public getScreenShotContainer()
	{
		screenShotController = document.getElementById(
			"screenShotContainer"
		) as HTMLCanvasElement | null;
		return screenShotController;
	}

	// 设置截图容器大小
	public setScreenShotSize(width: number, height: number)
	{
		this.getScreenShotContainer()
		if (screenShotController === null) return

		screenShotController.width = width;
		screenShotController.height = height;
	}

	// 设置截图容器位置
	public setScreenShotPosition(left: number, top: number)
	{
		this.getScreenShotContainer();
		if (screenShotController === null) return

		const { left: rLeft, top: rTop } = getToolRelativePosition(left, top)

		screenShotController.style.left = `${rLeft}px`
		screenShotController.style.top = `${rTop}px`
	}

	// 获取屏幕截图容器
	public getScreenShotImageController()
	{
		return screenShotImageController;
	}

	// 设置屏幕截图
	public setScreenShotImageController(imageController: HTMLCanvasElement)
	{
		screenShotImageController = imageController;
	}

	public getDragging()
	{
		return dragging;
	}

	public setDragging(status: boolean)
	{
		dragging = status;
	}

	public getDraggingTrim()
	{
		return draggingTrim;
	}

	public setDraggingTrim(status: boolean)
	{
		draggingTrim = status;
	}

	public getBorderSize()
	{
		return borderSize;
	}

	// 获取裁剪框位置信息
	public getCutOutBoxPosition()
	{
		return cutOutBoxPosition;
	}

	// 设置裁剪框位置信息
	public setCutOutBoxPosition(
		mouseX: number,
		mouseY: number,
		width: number,
		height: number
	)
	{
		cutOutBoxPosition.startX = mouseX;
		cutOutBoxPosition.startY = mouseY;
		cutOutBoxPosition.width = width;
		cutOutBoxPosition.height = height;
	}

	public getToolPositionStatus()
	{
		return toolPositionStatus;
	}

	public setToolPositionStatus(status: boolean)
	{
		toolPositionStatus = status;
	}

	// 获取截图工具栏点击状态
	public getToolClickStatus()
	{
		return toolClickStatus;
	}

	// 设置截图工具栏点击状态
	public setToolClickStatus(status: boolean)
	{
		toolClickStatus = status;
	}

	// 获取截图工具栏dom
	public getToolController()
	{
		toolController = document.getElementById(
			"toolPanel"
		) as HTMLDivElement | null;
		return toolController;
	}

	// 设置截图工具栏展示状态
	public setToolStatus(status: boolean)
	{
		toolController = this.getToolController() as HTMLDivElement;
		if (status)
		{
			toolController.style.display = "block";
			return;
		}
		toolController.style.display = "none";
	}

	// 获取/设置当前点击的工具栏条目名称
	public getToolName()
	{
		return toolName;
	}
	public setToolName(itemName: string)
	{
		toolName = itemName;
	}

	public setActiveToolName(toolName: string)
	{
		activeTool = toolName;
	}

	public getActiveToolName()
	{
		return activeTool;
	}

	// 设置裁剪框尺寸显示容器展示状态
	public setCutBoxSizeStatus(status: boolean)
	{
		if (cutBoxSizeContainer == null) return;
		if (status)
		{
			cutBoxSizeContainer.style.display = "flex";
			return;
		}
		cutBoxSizeContainer.style.display = "none";
	}

	// 设置截图工具位置信息
	public setToolInfo(left: number, top: number)
	{
		toolController = document.getElementById("toolPanel") as HTMLDivElement;
		const { left: rLeft, top: rTop } = getToolRelativePosition(left, top);
		toolController.style.left = rLeft + "px";
		let sscTop = 0;
		if (screenShotController)
		{
			sscTop = parseInt(screenShotController.style.top);
		}
		toolController.style.top = rTop + sscTop + "px";
	}

	// 设置裁剪框尺寸
	public setCutBoxSize(width: number, height: number)
	{
		if (cutBoxSizeContainer == null) return;
		const childrenPanel = cutBoxSizeContainer.childNodes;
		// p标签已存在直接更改文本值即可
		if (childrenPanel.length > 0)
		{
			(childrenPanel[0] as HTMLParagraphElement).innerText = `${width} * ${height}`;
			return;
		}
		// 不存在则渲染
		const textPanel = document.createElement("p");
		textPanel.innerText = `${width} * ${height}`;
		cutBoxSizeContainer.appendChild(textPanel);
	}

	// 获取工具栏位置
	public getToolPosition()
	{
		toolController = this.getToolController();
		if (toolController == null) return;
		return {
			left: toolController.offsetLeft,
			top: toolController.offsetTop
		};
	}

	public getRightPanel()
	{
		rightPanel = document.getElementById("rightPanel");
		return rightPanel;
	}
	public setRightPanel(status: boolean)
	{
		rightPanel = this.getRightPanel();
		if (rightPanel == null) return;
		if (status)
		{
			rightPanel.style.display = "flex";
			return;
		}
		rightPanel.style.display = "none";
	}

	// 销毁截图容器
	public destroyDOM()
	{
		if (screenShotController == null || toolController == null) return;
		const plugInParameters = new PluginParameters();
		document.body.removeChild(screenShotController);
		document.body.removeChild(toolController);
		// 重置插件全局参数状态
		plugInParameters.setInitStatus(true);
	}
}
