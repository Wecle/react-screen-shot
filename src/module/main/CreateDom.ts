import { ScreenShotType, ToolbarType } from "../types/type";
import toolbar from "../config/toolbar";
import { toolClickEvent } from "../utils/ToolClickEvent";

export default class CreateDom
{
	private readonly screenShotController: HTMLCanvasElement;

	// 截图工具栏容器
	private readonly toolController: HTMLDivElement;

	// 截图工具栏图标
	private readonly toolbar: Array<ToolbarType>;

	// 截图完成回调函数
	private readonly completeCallback: Function | undefined;
	// 截图关闭毁掉函数
	private readonly closeCallback: Function | undefined;

	constructor(options: ScreenShotType)
	{
		this.screenShotController = document.createElement("canvas");
		this.toolController = document.createElement("div");

		this.completeCallback = (base64: string) =>
		{
			sessionStorage.setItem("screenShotImg", base64);
		};

		this.toolbar = toolbar;
		// 渲染工具栏
		this.setToolBarIco();
		// 为所有dom设置id
		this.setAllControllerId();
		// 渲染页面
		this.setDomToBody();
		// 隐藏所有dom
		this.hiddenAllDom();
	}

	// 渲染截图工具栏图标
	private setToolBarIco()
	{
		for (let i = 0; i < this.toolbar.length; i++)
		{
			const item = this.toolbar[i]
			const itemPanel = document.createElement("div");
			itemPanel.className = `item-panel ${item.title}`;
			itemPanel.addEventListener("click", e =>
			{
				toolClickEvent(
					item.title,
					item.id,
					e,
					this.completeCallback,
					this.closeCallback
				);
			});
			itemPanel.setAttribute("data-title", item.title);
			itemPanel.setAttribute("data-id", item.id + "");
			this.toolController.appendChild(itemPanel);
		}
	}

	// 为所有 Dom 设置 id
	private setAllControllerId()
	{
		this.screenShotController.id = "screenShotContainer";
		this.toolController.id = "toolPanel";
	}

	// 隐藏所有 Dom
	private hiddenAllDom()
	{
		this.screenShotController.style.display = "none";
		this.toolController.style.display = "none";
	}

	// 将截图相关 Dom 渲染到 body
	private setDomToBody()
	{
		document.body.appendChild(this.screenShotController);
		document.body.appendChild(this.toolController);
	}
}
