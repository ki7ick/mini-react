import { ReactElementType } from "shared/ReactTypes";
import { FiberNode } from "./fiber";
import { processUpdateQueue, type UpdateQueue } from "./updateQueue";
import { HostComponent, HostRoot, HostText } from "./workTags";
import { mountChildFibers, reconcileChildFibers } from "./childFibers";

export const beginWork = (wip: FiberNode) => {
  // 比较，返回子FiberNode
  switch (wip.tag) {
    case HostRoot:
      return updateHostRoot(wip);

    case HostComponent:
      return updateHostComponent(wip);

    case HostText:
      return null;

    default:
      if (__DEV__) {
        console.warn("beginWork 未实现的类型", wip);
      }

      break;
  }

  return null;
};

function updateHostRoot(wip: FiberNode) {
  const baseState = wip.memoizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<Element>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;

  const { memoizedState } = processUpdateQueue(baseState, pending); // 得到了最新状态

  wip.memoizedState = memoizedState;

  // 注意这里得到的 memoizedState 是 Element, 所以得将它作为 child
  const nexChildren = wip.memoizedState;
  reconcileChildren(wip, nexChildren);
  return wip.child;
}

function updateHostComponent(wip: FiberNode) {
  const nextProps = wip.pendingProps;
  const nextChildren = nextProps.children;
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
  const current = wip.alternate;

  if (current !== null) {
    // update
    wip.child = reconcileChildFibers(wip, current?.child, children);
  } else {
    // mount
    wip.child = mountChildFibers(wip, null, children);
  }
}
