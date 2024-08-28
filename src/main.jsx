/** @jsxRuntime classic*/
/** @jsx MyReact.createElement */

import MyReact from './my-react';

const container = document.querySelector('#root');
const root = MyReact.createRoot(container);

function App() {
  const [count, setCount] = MyReact.useState(0);
  const [visible, setVisible] = MyReact.useState(false);
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => {
        setCount(count + 1)
        setVisible(!visible)
      }}>Increment</button>
      {visible ? <p>Visible{count}</p> : null}
    </div>
  )
}
root.render(<App />);
