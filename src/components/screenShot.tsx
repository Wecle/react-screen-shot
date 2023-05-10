import React from 'react'
import InitData from '../module/main/InitData'

interface ScreenShotType
{
}

const ScreenShot: React.FC<ScreenShotType> = (props) =>
{
	// const {} = props
	const initData = new InitData()

	return (
		<div id="screenShotPanel">
			<canvas id="screenShotContainer" />
		</div>
	)
}

export default ScreenShot
