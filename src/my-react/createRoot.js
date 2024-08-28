let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = [];
/**
 * <div>
 *    <h1>
 *      <p></p>
 *      <a />
 *    </h1>
 *    <h2></h2>
 * </div>
 */

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;
  // 比较 wipFiber 和 oldFiber 的子节点
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (index < elements.length || oldFiber) {
    const childrenElement = elements[index];
    let newFiber = null;
    const sameType = oldFiber && childrenElement && oldFiber.type === childrenElement.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: childrenElement.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      }
    }

    if (!sameType && childrenElement) {
      newFiber = {
        type: childrenElement.type,
        props: childrenElement.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      }
    }

    if (!sameType && oldFiber) {
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (childrenElement) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber;
    index++;
  }
}

function performUnitOfWork(fiber) {
  // TODO 将 ReactElement 转换成一个真实DOM
  // 如果 fiber 没有真实 DOM 节点，创建一个
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  const elements = fiber?.props?.children;

  reconcileChildren(fiber, elements);
  // 为当前 fiber 创建子fiber fiber.child = new
  // new fiber === parent | sibling
  // parent child sibling

  // 获得子节点

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
// 筛选出children之外的属性
const isProperty = key => key !== 'children';
// 筛选出要移除的属性
const isGone = (prev, next) => key => !(key in next);
// 筛选出要更新的属性
const isNew = (prev, next) => key => prev[key] !== next[key];
// 判断是否是事件属性
const isEvent = key => key.startsWith('on');

function updateDom(dom, prevProps, nextProps) {
  // 移除旧的监听事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 移除旧的属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = '';
    });

  // 添加新的属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // 添加新的监听事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
function commitWork(fiber) {
  if (!fiber) return;

  const domParent = fiber.parent.dom;

  switch (fiber.effectTag) {
    case 'PLACEMENT':
      !!fiber.dom &&
        domParent.appendChild(fiber.dom);
      break;
    case 'UPDATE':
      // todo
      !!fiber.dom &&
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
      break;
    case 'DELETION':
      !!fiber.dom &&
        domParent.removeChild(fiber.dom);
      break;
    default:
      break;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);

}

// 一次性渲染
function commitRoot() {
  // todo
  commitWork(wipRoot.child);

  deletions.forEach(commitWork);

  currentRoot = wipRoot;

  wipRoot = null;
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; // 得到浏览器当前帧剩余时间 React -> scheduler
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function createDom(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

function createRoot(container) {
  const containerNode = container;

  function render(element) {
    wipRoot = {
      dom: containerNode,
      props: {
        children: [element]
      },
      alternate: currentRoot
    }

    nextUnitOfWork = wipRoot
    deletions = []
  }

  return {
    render
  }
}

export default createRoot;
