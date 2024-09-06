import { Container } from "hostConfig";
import { FiberNode, FiberRootNode } from "./fiber";
import { HostRoot } from "./workTags";
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  type UpdateQueue
} from "./updateQueue";
import type { ReactElementType } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./workLoop";

export function createContainer(container: Container) {
  // 比如说reactDom.createRoot().render() 里 reactDom.createRoot() 会执行这个方法
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);
  hostRootFiber.updateQueue = createUpdateQueue();
  return root;
}

export function updateContainer(
  element: ReactElementType | null,
  root: FiberRootNode
) {
  // 比如说reactDom.createRoot().render() 里 render() 会执行这个方法
  const hostRootFiber = root.current;
  const update = createUpdate<ReactElementType | null>(element);
  enqueueUpdate(
    hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
    update
  );
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
}
