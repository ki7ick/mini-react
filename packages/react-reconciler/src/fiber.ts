import type { Props, Key, Ref, ReactElementType } from "shared/ReactTypes";
import { FunctionComponent, HostComponent, type WorkTag } from "./workTags";
import { type Flags, NoFlags } from "./fiberFlags";
import { type Container } from "hostConfig";

export class FiberNode {
  type: any;
  tag: WorkTag;
  pendingProps: Props;
  key: Key;
  stateNode: any;
  ref: Ref;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  memoizedProps: Props | null;
  memoizedState: any;
  alternate: FiberNode | null;
  flags: Flags;
  subtreeFlags: Flags;
  updateQueue: unknown;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // 实例的属性
    this.tag = tag;
    this.key = key;
    this.stateNode = null;
    this.type = null;

    // 表示节点之间关系
    this.return = null;
    this.sibling = null;
    this.child = null;
    this.index = 0; // 例如 ul => li 的index

    this.ref = null;

    // 作为工作单元
    this.pendingProps = pendingProps;
    this.memoizedProps = null; // 工作完成后的props
    this.memoizedState = null;

    this.alternate = null;
    this.flags = NoFlags;
    this.subtreeFlags = NoFlags;
    this.updateQueue = null;
  }
}

export class FiberRootNode {
  container: Container;
  current: FiberNode; // 指向hostRootFiber
  finishedWork: FiberNode | null; // 更新已经完成整个递归流程的hostRootFiber

  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    hostRootFiber.stateNode = this;
    this.finishedWork = null;
  }
}

export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props
) => {
  // 双缓存
  let wip = current.alternate;

  if (wip === null) {
    // 首屏渲染时, mount
    wip = new FiberNode(current.tag, pendingProps, current.key);
    wip.stateNode = current.stateNode;

    wip.alternate = current;
    current.alternate = wip;
  } else {
    // update
    wip.pendingProps = pendingProps;
    // 清除副作用
    wip.flags = NoFlags;
    wip.subtreeFlags = NoFlags;
  }

  wip.type = current.type;
  wip.updateQueue = current.updateQueue;
  wip.child = current.child;
  wip.memoizedProps = current.memoizedProps;
  wip.memoizedState = current.memoizedState;

  return wip;
};

export function createFiberFromElement(element: ReactElementType) {
  const { type, key, props } = element;
  let fiberTag: WorkTag = FunctionComponent;

  if (typeof type === "string") {
    fiberTag = HostComponent;
  } else if (typeof type !== "function" && __DEV__) {
    console.warn("未定义的类型", element);
  }

  const fiber = new FiberNode(fiberTag, props, key);
  fiber.type = type;
  return fiber;
}
