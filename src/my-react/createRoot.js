let nextUnitOfWork = null;
let wipRoot = null; // 当前正在构建的 fiber 树根节点
let currentRoot = null; // 当前的 fiber 树根节点
let deletions = [];
let wipFiber = null;
let hookIndex = 0;

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

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  wipFiber.hooks = [];
  hookIndex = 0;
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 为当前 fiber 创建子节点 fiber.child => new
  // new fiber == parent | sibling 
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber);
  }
  // return 下一个任务单元 当前任务单元已经在处理了
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

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function commitWork(fiber) {
  if (!fiber) return;

  // const domParent = fiber.parent.dom;
  let domParentFiber = fiber.parent;

  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

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
      commitDeletion(fiber, domParent);
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
  // 遍历找到下一个需要处理的 Fiber 节点
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

export function createRoot(container) {
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

export function useState(initial) {
  const oldHook = wipFiber?.alternate?.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  }

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = action
  })

  const setState = action => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    }
    // 进行下一轮 更新 DOM 操作
    nextUnitOfWork = wipRoot;
    deletions = [];
  }

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}
