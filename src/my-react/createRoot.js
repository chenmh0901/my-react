let nextUnitOfWork = null;

/**
 * <div>
 *    <h1>
 *      <p></p>
 *      <a />
 *    </h1>
 *    <h2></h2>
 * </div>
 */
function performUnitOfWork(fiber) {
  // TODO 将 ReactElement 转换成一个真实DOM
  // 如果 fiber 没有真实 DOM 节点，创建一个
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // 如果 fiber 有父节点，将 fiber.dom 添加到父节点中
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }
  // 为当前 fiber 创建子fiber fiber.child = new
  // new fiber === parent | sibling
  // parent child sibling

  // 获得子节点
  const elements = fiber?.props?.children;
  let prevSibling = null;
  elements.forEach((childrenElement, index) => {
    const newFiber = {
      parent: fiber,
      sibling: null,
      props: childrenElement.props,
      type: childrenElement.type,
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber
  })
  // return 下一个任务单元
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; // 得到浏览器当前帧剩余时间 React -> scheduler
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function createDom(element) {
  const dom = element.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type);
  const isProperty = key => key !== 'children';
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name];
    });
  return dom;
}

function createRoot(container) {
  const containerNode = container;

  function render(element) {
    nextUnitOfWork = {
      dom: containerNode,
      props: {
        children: [element]
      }
    }
  }

  return {
    render
  }
}

export default createRoot;
