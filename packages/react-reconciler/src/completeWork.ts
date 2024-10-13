import {
  appendInitialChild,
  Container,
  createInstance,
  createTextInstance,
  Instance
} from "hostConfig";
import { FiberNode } from "./fiber";
import {
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from "./workTags";
import { NoFlags, Update } from "./fiberFlags";

function markUpdate(fiber: FiberNode) {
  fiber.flags |= Update;
}

export const completeWork = (wip: FiberNode) => {
  // 递归中的归

  const newProps = wip.pendingProps;
  const current = wip.alternate;

  switch (wip.tag) {
    case HostComponent:
      if (current !== null && wip.stateNode) {
        // TODO: update
        // 1. props 是否变化
        // 2. 变了 Update flag
        // TODO: 判断变化的可以后续实现，目前直接用新的
        markUpdate(wip);
      } else {
        // 1. 构建DOM
        const instance = createInstance(wip.type, newProps);
        // 2. 将 DOM 插入到 DOM 树中
        appendAllChildren(instance, wip);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;

    case HostText:
      if (current !== null && wip.stateNode) {
        // update
        const oldText = current.memoizedProps?.content;
        const newText = newProps.content;

        if (oldText !== newText) {
          markUpdate(wip);
        }
      } else {
        const instance = createTextInstance(newProps.content);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;

    case HostRoot:
    case FunctionComponent:
    case Fragment:
      bubbleProperties(wip);
      return null;

    default:
      if (__DEV__) {
        console.warn("未处理的 completeWork 情况", wip);
      }
      break;
  }
};

function appendAllChildren(parent: Container | Instance, wip: FiberNode) {
  let node = wip.child;

  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === wip) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === wip) {
        return;
      }

      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags;
  let child = wip.child;

  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;

    child.return = wip;
    child = child.sibling;
  }

  wip.subtreeFlags |= subtreeFlags;
}
