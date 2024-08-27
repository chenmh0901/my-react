function createRoot(container) {
  const containerNode = container;

  console.log(containerNode);
  function render(element) {
    const dom = element.type == 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type);

    const isProperty = key => key !== 'children';

    Object.keys(element?.props)
      .filter(isProperty)
      .forEach(name => {
        dom[name] = element.props[name]
      })

    element?.props?.children?.forEach(child => {
      render(child)
    })
    containerNode.appendChild(dom);
  }

  return {
    render
  }
}

export default createRoot;
