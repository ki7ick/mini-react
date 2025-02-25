import { ReactElementType } from "shared/ReactTypes";
import { FiberNode } from "./fiber";
import { processUpdateQueue, type UpdateQueue } from "./updateQueue";
import {
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from "./workTags";
import { mountChildFibers, reconcileChildFibers } from "./childFibers";
import { renderWithHooks } from "./fiberHooks";
import { Lane } from "./fiberLanes";

export const beginWork = (wip: FiberNode, renderLane: Lane) => {
  // 比较，返回子FiberNode
  switch (wip.tag) {
    case HostRoot:
      return updateHostRoot(wip, renderLane);

    case HostComponent:
      return updateHostComponent(wip);

    case HostText:
      return null;

    case FunctionComponent:
      return updateFunctionComponent(wip, renderLane);

    case Fragment:
      return updateFragment(wip);

    default:
      if (__DEV__) {
        console.warn("beginWork 未实现的类型", wip);
      }

      break;
  }

  return null;
};

function updateFragment(wip: FiberNode) {
  const nextChildren = wip.pendingProps;
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
  const nextChildren = renderWithHooks(wip, renderLane);
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
  const baseState = wip.memoizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<Element>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;

  const { memoizedState } = processUpdateQueue(baseState, pending, renderLane); // 得到了最新状态
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
