console.log('App-minimal.jsx: Loading...')

function App() {
  console.log('App-minimal.jsx: Rendering...')
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Invoice App - Minimal Test</h1>
      <p>If you see this, React is working!</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}

console.log('App-minimal.jsx: Component defined')

export default App
