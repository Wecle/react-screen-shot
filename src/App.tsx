import useScreenShot from "./hook/useScreenShot"

function App()
{

	const handleShotClick = useScreenShot({})

	return (
		<>
			<h1>ScreenShot</h1>
			<button onClick={handleShotClick}>click</button>
		</>
	)
}

export default App
