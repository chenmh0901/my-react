// import React from 'react';
// import { createRoot } from 'react-dom/client';
import MyReact from './my-react';


const element = MyReact.createElement(
  'div',
  {
    title: 'hello',
  },
  'word',
  MyReact.createElement('span', null, 'hello')
)

console.log(element);

const container = document.querySelector('#root');
const root = MyReact.createRoot(container);

root.render(element);
