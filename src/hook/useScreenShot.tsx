import React, { useCallback } from "react"
import ScreenShot from "../module/main"

interface ScreenShotProps
{
}

const useScreenShot = (props: ScreenShotProps) =>
{
	return useCallback(() =>
	{
		new ScreenShot({})
	}, [])
}

export default useScreenShot
