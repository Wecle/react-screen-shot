import { getCanvas2dCtx } from "./common/GetCanvas2dCtx";
import CreateDom from "./main/CreateDom";
import InitData from "./main/InitData";
import PluginParameters from "./main/PluginParameters";
import { DrawCutOutBoxReturnType, ScreenShotType, ToolPositionValType } from "./types/type";
import "./styles/scss/screen-shot.scss";
import { drawMask } from "./utils/DrawMask";
import { fixedData, nonNegativeData } from "./common/FixedData";
import { drawCutOutBox } from "./utils/DrawCutOutBox";
import { zoomCutOutBoxPosition } from "./common/ZoomCutOutBoxPosition";
import { saveBorderArrInfo } from "./common/SaveBorderArrInfo";
import { getDrawBoundaryStatus } from "./utils/BoundaryJudgment";
import { calculateToolLocation } from "./utils/CalculateToolLocation";

export default class ScreenShot
{
	// 当前实例的响应式 data 数据
	private readonly data: InitData;

	// video容器用于存放屏幕MediaStream流
	private readonly videoController: HTMLVideoElement;

	// 截图区域	canvas 容器
	private screenShotContainer: HTMLCanvasElement | null | undefined;

	// 截图图片存放容器
	private screenShotImageController: HTMLCanvasElement;

	// 截图区域画布
	private screenShotCanvas: CanvasRenderingContext2D | undefined;

	// 画布信息
	private plugInParameters: PluginParameters;

	// 截图容器位置信息
	private position: { top: number; left: number } = { left: 0, top: 0 };

	private drawStatus = false;

	// 鼠标拖动状态
	private dragFlag = false;

	// 鼠标点击状态
	private clickFlag = false;

	// 裁剪框信息
	private cropBoxInfo: {
		x: number;
		y: number;
		w: number;
		h: number;
	} | null = null;

	// 当前操作的边框节点
	private borderOption: number | null = null;

	// 点击裁剪框时的鼠标坐标
	private movePosition: { moveStartX: number; moveStartY: number; } = {
		moveStartX: 0,
		moveStartY: 0
	};

	// 上一个裁剪框坐标信息
	private drawGraphPrevX = 0;
	private drawGraphPrevY = 0;

	// 图形位置参数
	private drawGraphPosition: DrawCutOutBoxReturnType = {
		startX: 0,
		startY: 0,
		width: 0,
		height: 0
	};

	// 裁剪框边框节点坐标事件
	private cutOutBoxBorderArr: Array<{ x: number; y: number; width: number; height: number; index: number; option: number; }> = [];

	private dpr = window.devicePixelRatio || 1;

	// 临时图形位置参数
	private tempGraphPosition: DrawCutOutBoxReturnType = {
		startX: 0,
		startY: 0,
		width: 0,
		height: 0
	};

	// webrtc模式下的屏幕流数据
	private captureStream: MediaStream | null = null;

	private wrcImgPosition = { x: 0, y: 0, w: 0, h: 0 };

	private wrcReplyTime = 500;

	// 截图工具栏dom
	private toolController: HTMLDivElement | null | undefined;

	// 工具栏显示位置
	private placement: ToolPositionValType = "center";

	// 截全屏时工具栏展示的位置要减去的高度
	private fullScreenDiffHeight = 60;

	// 全屏截取状态
	private getFullScreenStatus = false;

	constructor(options: ScreenShotType)
	{
		// 初始化画布
		this.plugInParameters = new PluginParameters()
		// 创建截图 DOM
		new CreateDom(options)
		// 创建并获取webrtc模式所需要的辅助dom
		this.videoController = document.createElement("video");
		this.videoController.autoplay = true;
		// 初始化截图图片存放容器
		this.screenShotImageController = document.createElement("canvas");
		// 实例化响应式 data
		this.data = new InitData();

		// 获取截图区域canvas容器(获取的同时也会为InitData中的全局变量赋值)
		this.setGlobalParameter()

		this.load()
		if (this.toolController == null || this.screenShotContainer == null)
		{
			return;
		}
	}

	public getCanvasController(): HTMLCanvasElement | null | undefined
	{
		return this.screenShotContainer
	}

	private setGlobalParameter()
	{
		this.screenShotContainer = this.data.getScreenShotContainer() as HTMLCanvasElement | null
		this.toolController = this.data.getToolController() as HTMLDivElement | null;
	}

	private load()
	{
		// const canvasSize = this.plugInParameters.getCanvasSize()
		const viewSize = {
			width: parseFloat(window.getComputedStyle(document.body).width),
			height: parseFloat(window.getComputedStyle(document.body).height)
		}

		// 设置截图区域canvas宽高
		this.data.setScreenShotSize(viewSize.width, viewSize.height);
		// 设置截图容器位置
		this.data.setScreenShotPosition(this.position.left, this.position.top)
		// 设置截图图片存放容器宽高
		this.screenShotImageController.width = viewSize.width;
		this.screenShotImageController.height = viewSize.height;
		if (this.screenShotContainer == null) return
		// 获取截图区域canvas容器画布
		const context = getCanvas2dCtx(this.screenShotContainer, this.screenShotImageController.width, this.screenShotImageController.height)
		if (context === null) return
		// 显示截图容器
		this.data.showScreenShotPanel()

		// webrtc
		this.screenShot()
	}

	private initScreenShot(context: CanvasRenderingContext2D, screenShotContainer: HTMLCanvasElement)
	{
		// 赋值截图区域 canvas 画布
		this.screenShotCanvas = context;
		// 存储屏幕截图
		this.data.setScreenShotImageController(screenShotContainer)

		// 绘制蒙层
		drawMask(context, screenShotContainer)

		// 添加监听
		this.screenShotContainer?.addEventListener(
			"mousedown",
			this.mouseDownEvent
		);
		this.screenShotContainer?.addEventListener(
			"mousemove",
			this.mouseMoveEvent
		);
		this.screenShotContainer?.addEventListener(
			"mouseup",
			this.mouseUpEvent
		);

		// 是否初始化裁剪框
		if (this.cropBoxInfo != null && Object.keys(this.cropBoxInfo).length == 4)
		{
			this.initCropBox(this.cropBoxInfo);
		}
	}

	// 鼠标点击事件
	private mouseDownEvent = (event: MouseEvent) =>
	{
		// if (event.button === 1 || event.button === 2) return
		// 设置裁剪框拖拽状态
		this.data.setDragging(true);
		this.drawStatus = false;

		// 重置工具栏超出状态
		this.data.setToolPositionStatus(false);

		this.clickFlag = true;

		// 获取鼠标点击位置
		const mouseX = nonNegativeData(event.offsetX)
		const mouseY = nonNegativeData(event.offsetY)

		// 如果当前操作的是截图工具栏
		if (this.data.getToolClickStatus())
		{
			// 记录当前鼠标开始坐标
			this.drawGraphPosition.startX = mouseX;
			this.drawGraphPosition.startY = mouseY;
		}

		// 如果操作的是裁剪框
		if (this.borderOption)
		{
			// 设置为拖动状态
			this.data.setDraggingTrim(true);
			// 记录移动时的起始点坐标
			this.movePosition.moveStartX = mouseX;
			this.movePosition.moveStartY = mouseY;
		} else
		{
			// 保存当前裁剪框的坐标
			this.drawGraphPrevX = this.drawGraphPosition.startX;
			this.drawGraphPrevY = this.drawGraphPosition.startY;
			// 绘制裁剪框,记录当前鼠标开始坐标
			this.drawGraphPosition.startX = mouseX;
			this.drawGraphPosition.startY = mouseY;
		}
	}

	// 鼠标移动事件
	private mouseMoveEvent = (event: MouseEvent) =>
	{
		// if (event.button === 1 || event.button === 2) return
		if (this.screenShotCanvas == null ||
			this.screenShotContainer == null)
		{
			return
		}
		// 鼠标处于按下状态
		if (!this.data.getToolClickStatus() && this.data.getDragging())
		{
			// 修改拖动状态为 true
			this.dragFlag = true
			// 隐藏截图工具栏
			this.data.setToolStatus(false);
		}
		this.clickFlag = false;
		// 获取当前绘制工具中的工具位置信息
		const { startX, startY, width, height } = this.drawGraphPosition
		// 获取当前鼠标坐标
		const currentX = nonNegativeData(event.offsetX);
		const currentY = nonNegativeData(event.offsetY);

		// 绘制中工具的临时宽高
		const tempWidth = currentX - startX;
		const tempHeight = currentY - startY;

		// 工具栏绘制
		if (this.data.getToolClickStatus() && this.data.getDragging())
		{
			// 获取裁剪框位置信息
			const cutBoxPosition = this.data.getCutOutBoxPosition();
			// 绘制中工具的起始x、y坐标不能小于裁剪框的起始坐标
			// 绘制中工具的起始x、y坐标不能大于裁剪框的结束标作
			// 当前鼠标的x坐标不能小于裁剪框起始x坐标，不能大于裁剪框的结束坐标
			// 当前鼠标的y坐标不能小于裁剪框起始y坐标，不能大于裁剪框的结束坐标
			if (
				!getDrawBoundaryStatus(startX, startY, cutBoxPosition) ||
				!getDrawBoundaryStatus(currentX, currentY, cutBoxPosition)
			)
				return;
		}

		if (this.screenShotCanvas && this.screenShotContainer)
		{
			// console.log(currentX, currentY, startX, startY)
			// 执行裁剪框操作函数
			this.operatingCutOutBox(
				currentX,
				currentY,
				startX,
				startY,
				width,
				height,
				this.screenShotCanvas
			);
			if (!this.data.getDragging() || this.data.getDraggingTrim()) return
			// 绘制裁剪框
			this.tempGraphPosition = drawCutOutBox(
				startX,
				startY,
				tempWidth,
				tempHeight,
				this.screenShotCanvas,
				this.data.getBorderSize(),
				this.screenShotContainer,
				this.screenShotImageController
			) as DrawCutOutBoxReturnType;
		} else
		{
			return
		}

	}

	// 鼠标抬起事件
	private mouseUpEvent = (event: MouseEvent) =>
	{
		// if (event.button === 1 || event.button === 2) return
		// 绘制结束
		this.data.setDragging(false);
		this.data.setDraggingTrim(false);
		// 截图容器判空
		if (this.screenShotCanvas == null || this.screenShotContainer == null)
		{
			return;
		}
		// 工具栏未点击且鼠标未拖动且单击截屏状态为false则复原裁剪框位置
		if (!this.dragFlag)
		{
			// 复原裁剪框的坐标
			this.drawGraphPosition.startX = this.drawGraphPrevX;
			this.drawGraphPosition.startY = this.drawGraphPrevY;
			return;
		}
		// 调用者尚未拖拽生成选区
		// 鼠标尚未拖动
		// 单击截取屏幕状态为true
		// 则截取整个屏幕
		const cutBoxPosition = this.data.getCutOutBoxPosition();
		// console.log("cutBoxPosition:", cutBoxPosition)
		if (
			cutBoxPosition.width === 0 &&
			cutBoxPosition.height === 0 &&
			cutBoxPosition.startX === 0 &&
			cutBoxPosition.startY === 0 &&
			!this.dragFlag
		)
		{
			const borderSize = this.data.getBorderSize();
			this.getFullScreenStatus = true;
			// 设置裁剪框位置为全屏
			this.tempGraphPosition = drawCutOutBox(
				0,
				0,
				this.screenShotContainer.width - borderSize / 2,
				this.screenShotContainer.height - borderSize / 2,
				this.screenShotCanvas,
				borderSize,
				this.screenShotContainer,
				this.screenShotImageController
			) as DrawCutOutBoxReturnType;
		}

		// 保存绘制后的图形位置信息
		this.drawGraphPosition = this.tempGraphPosition;
		const { startX, startY, width, height } = this.drawGraphPosition;
		this.data.setCutOutBoxPosition(startX, startY, width, height);

		// 保存边框节点信息
		this.cutOutBoxBorderArr = saveBorderArrInfo(
			this.data.getBorderSize(),
			this.drawGraphPosition
		);

		if (this.screenShotContainer != null && this.dragFlag)
		{
			// 修改鼠标状态为拖动
			this.screenShotContainer.style.cursor = "move";
			// 显示截图工具栏
			this.data.setToolStatus(true);
			// 复原拖动状态
			this.dragFlag = false;
			if (this.toolController != null)
			{
				this.showToolBar();
			}
		}
	}

	// 初始化裁剪框
	private initCropBox(cropBoxInfo: { x: number; y: number; w: number; h: number; }): void
	{

	}

	/**
   * 操作裁剪框
   * @param currentX 裁剪框当前x轴坐标
   * @param currentY 裁剪框当前y轴坐标
   * @param startX 鼠标x轴坐标
   * @param startY 鼠标y轴坐标
   * @param width 裁剪框宽度
   * @param height 裁剪框高度
   * @param context 需要进行绘制的canvas画布
   * @private
   */
	private operatingCutOutBox(
		currentX: number,
		currentY: number,
		startX: number,
		startY: number,
		width: number,
		height: number,
		context: CanvasRenderingContext2D
	)
	{
		// canvas元素不存在
		if (this.screenShotContainer == null)
		{
			return;
		}
		// 获取鼠标按下时的坐标
		const { moveStartX, moveStartY } = this.movePosition;
		// console.log(moveStartX, moveStartY)
		// 裁剪框边框节点事件存在且裁剪框未进行操作，则对鼠标样式进行修改
		if (this.cutOutBoxBorderArr.length > 0 && !this.data.getDraggingTrim())
		{
			// 标识鼠标是否在裁剪框内
			let flag = false;
			// 判断鼠标位置
			context.beginPath();
			for (let i = 0; i < this.cutOutBoxBorderArr.length; i++)
			{
				// console.log(this.cutOutBoxBorderArr[i].x, this.cutOutBoxBorderArr[i].y)
				context.rect(
					this.cutOutBoxBorderArr[i].x,
					this.cutOutBoxBorderArr[i].y,
					this.cutOutBoxBorderArr[i].width,
					this.cutOutBoxBorderArr[i].height
				);
				// 当前坐标点处于8个可操作点上，修改鼠标指针样式
				if (context.isPointInPath(currentX * this.dpr, currentY * this.dpr))
				{
					switch (this.cutOutBoxBorderArr[i].index)
					{
						case 1:
							this.screenShotContainer.style.cursor = "move";
							break;
						case 2:
							if (this.data.getToolClickStatus()) break;
							// 工具栏被点击则不改变指针样式
							this.screenShotContainer.style.cursor = "ns-resize";
							break;
						case 3:
							if (this.data.getToolClickStatus()) break;
							this.screenShotContainer.style.cursor = "ew-resize";
							break;
						case 4:
							if (this.data.getToolClickStatus()) break;
							this.screenShotContainer.style.cursor = "nwse-resize";
							break;
						case 5:
							if (this.data.getToolClickStatus()) break;
							this.screenShotContainer.style.cursor = "nesw-resize";
							break;
						default:
							break;
					}
					this.borderOption = this.cutOutBoxBorderArr[i].option;
					flag = true;
					break;
				}
			}
			context.closePath();
			if (!flag)
			{
				// 鼠标移出裁剪框重置鼠标样式
				this.screenShotContainer.style.cursor = "default";
				// 重置当前操作的边框节点为null
				this.borderOption = null;
			}
		}

		// 裁剪框正在被操作
		if (this.data.getDraggingTrim())
		{
			// 当前操作节点为1时则为移动裁剪框
			if (this.borderOption === 1)
			{
				// 计算要移动的x轴坐标
				let x = fixedData(
					currentX - (moveStartX - startX),
					width,
					this.screenShotContainer.width
				);
				// 计算要移动的y轴坐标
				let y = fixedData(
					currentY - (moveStartY - startY),
					height,
					this.screenShotContainer.height
				);
				// 计算画布面积
				const containerWidth = this.screenShotContainer.width / this.dpr;
				const containerHeight = this.screenShotContainer.height / this.dpr;
				// 计算裁剪框在画布上所占的面积
				const cutOutBoxSizeX = x + width;
				const cutOutBoxSizeY = y + height;
				// 超出画布的可视区域，进行位置修正
				if (cutOutBoxSizeX > containerWidth)
				{
					x = containerWidth - width;
				}
				if (cutOutBoxSizeY > containerHeight)
				{
					y = containerHeight - height;
				}

				// 重新绘制裁剪框
				this.tempGraphPosition = drawCutOutBox(
					x,
					y,
					width,
					height,
					context,
					this.data.getBorderSize(),
					this.screenShotContainer as HTMLCanvasElement,
					this.screenShotImageController
				) as DrawCutOutBoxReturnType;
			} else
			{
				// 裁剪框其他8个点的拖拽事件
				const {
					tempStartX,
					tempStartY,
					tempWidth,
					tempHeight
				} = zoomCutOutBoxPosition(
					currentX,
					currentY,
					startX,
					startY,
					width,
					height,
					this.borderOption as number
				) as { tempStartX: number; tempStartY: number; tempWidth: number; tempHeight: number; };
				// 绘制裁剪框
				this.tempGraphPosition = drawCutOutBox(
					tempStartX,
					tempStartY,
					tempWidth,
					tempHeight,
					context,
					this.data.getBorderSize(),
					this.screenShotContainer as HTMLCanvasElement,
					this.screenShotImageController
				) as DrawCutOutBoxReturnType;
			}
		}
	}

	// 开始捕捉屏幕
	private startCapture = async () =>
	{
		let captureStream = null;
		try
		{
			// 捕获屏幕
			captureStream = await navigator.mediaDevices.getDisplayMedia({
				audio: false,
				video: {
					width: this.screenShotImageController.width * this.dpr,
					height: this.screenShotImageController.height * this.dpr
				},
				preferCurrentTab: true
			});
			// 将MediaStream输出至video标签
			this.videoController.srcObject = captureStream;
			// 储存屏幕流数据
			this.captureStream = captureStream;
		} catch (err)
		{
			// 销毁截图组件
			this.data.destroyDOM();
			throw `浏览器不支持webrtc或者用户未授权( ${err} )`;
		}
		return captureStream;
	};

	// 停止捕捉屏幕
	private stopCapture = () =>
	{
		const srcObject = this.videoController.srcObject;
		if (srcObject && "getTracks" in srcObject)
		{
			const tracks = srcObject.getTracks();
			tracks.forEach(track => track.stop());
			this.videoController.srcObject = null;
		}
	};

	private loadScreenFlowData()
	{
		setTimeout(() =>
		{
			// 获取截图区域canvas容器画布
			if (this.screenShotContainer == null) return;
			const canvasSize = this.plugInParameters.getCanvasSize();
			let containerWidth = this.screenShotImageController?.width;
			let containerHeight = this.screenShotImageController?.height;
			// 用户有传宽高时，则使用用户的
			if (canvasSize.canvasWidth !== 0 && canvasSize.canvasHeight !== 0)
			{
				containerWidth = canvasSize.canvasWidth;
				containerHeight = canvasSize.canvasHeight;
			}
			const context = getCanvas2dCtx(
				this.screenShotContainer,
				containerWidth,
				containerHeight
			);
			if (context == null) return;
			// 赋值截图区域canvas画布
			this.screenShotCanvas = context;
			// 将获取到的屏幕截图绘制到图片容器里
			const imgContext = getCanvas2dCtx(
				this.screenShotImageController,
				containerWidth,
				containerHeight
			);
			// 对webrtc源提供的图像宽高进行修复
			const { videoWidth, videoHeight } = this.videoController;
			let fixWidth = containerWidth;
			let fixHeight = (videoHeight * containerWidth) / videoWidth;
			if (fixHeight > containerHeight)
			{
				fixWidth = (containerWidth * containerHeight) / fixHeight;
				fixHeight = containerHeight;
			}
			// 对视频容器的内容进行裁剪
			fixWidth = this.wrcImgPosition.w > 0 ? this.wrcImgPosition.w : fixWidth;
			fixHeight = this.wrcImgPosition.h > 0 ? this.wrcImgPosition.h : fixHeight;
			console.log(videoWidth, videoHeight, fixWidth, fixHeight)
			imgContext?.drawImage(
				this.videoController,
				0,
				0,
				fixWidth,
				fixHeight
			);
			// 初始化截图容器
			this.initScreenShot(context, this.screenShotImageController);
			// let displaySurface: string | null | undefined = null;
			// let displayLabel: string | null | undefined = null;
			// if (this.captureStream)
			// {
			// 	// 获取当前选择的窗口类型
			// 	displaySurface = (this.captureStream.getVideoTracks()[0].getSettings() as any).displaySurface;
			// 	// 获取当前选择的标签页标识
			// 	displayLabel = this.captureStream.getVideoTracks()[0].label;
			// }
			// 停止捕捉屏幕
			this.stopCapture();
		}, this.wrcReplyTime);
	}

	private screenShot()
	{
		this.startCapture().then(() =>
		{
			this.loadScreenFlowData();
		});
	}

	private showToolBar(): void
	{
		if (this.toolController == null || this.screenShotContainer == null) return;
		// 计算截图工具栏位置
		const toolLocation = calculateToolLocation(
			this.drawGraphPosition,
			this.toolController.offsetWidth,
			this.screenShotContainer.width / this.dpr,
			this.placement
		);
		const containerHeight = this.screenShotContainer.height / this.dpr;

		// 工具栏的位置超出截图容器时，调整工具栏位置防止超出
		if (toolLocation.mouseY > containerHeight - 64)
		{
			toolLocation.mouseY -= this.drawGraphPosition.height + 64;
			// 超出屏幕顶部时
			if (toolLocation.mouseY < 0)
			{
				const containerHeight = parseInt(this.screenShotContainer.style.height);
				toolLocation.mouseY = containerHeight - this.fullScreenDiffHeight;
			}
			// 设置工具栏超出状态为true
			this.data.setToolPositionStatus(true);
		}

		// 当前截取的是全屏，则修改工具栏的位置到截图容器最底部，防止超出
		if (this.getFullScreenStatus)
		{
			const containerHeight = parseInt(this.screenShotContainer.style.height);
			// 重新计算工具栏的x轴位置
			const toolPositionX =
				(this.drawGraphPosition.width / this.dpr -
					this.toolController.offsetWidth) /
				2;
			toolLocation.mouseY = containerHeight - this.fullScreenDiffHeight;
			toolLocation.mouseX = toolPositionX;
		}

		// 显示并设置截图工具栏位置
		this.data.setToolInfo(
			toolLocation.mouseX + this.position.left,
			toolLocation.mouseY + this.position.top
		);

		// 状态重置
		this.getFullScreenStatus = false;
	}
}
