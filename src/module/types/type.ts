export interface ScreenShotType
{

}

// 绘制裁剪框所返回的数据类型
export interface DrawCutOutBoxReturnType
{
	startX: number;
	startY: number;
	width: number;
	height: number;
};

// 裁剪框节点事件定义
export interface CutOutBoxBorder
{
	x: number;
	y: number;
	width: number;
	height: number;
	index: number; // 样式
	option: number; // 操作
};

// 裁剪框位置参数
export interface PositionInfoType
{
	startX: number;
	startY: number;
	width: number;
	height: number;
};

// 工具栏的展示位置
export type ToolPositionValType = "left" | "right" | "center";

// 截图工具栏图标数据类型
export interface ToolbarType
{
	id: number;
	title: string
};
