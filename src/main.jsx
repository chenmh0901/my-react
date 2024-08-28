/** @jsxRuntime classic*/
/** @jsx MyReact.createElement */

import MyReact from './my-react';

const container = document.querySelector('#root');
const root = MyReact.createRoot(container);

const updateValue = e => {
  renderder(e.target.value)
}
const renderder = value => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h1 style={{
        color: "red"
      }}>output{value}</h1>
    </div>
  )
  console.log('element', element)
  root.render(element);
}

renderder()
