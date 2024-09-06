import { beginWork } from "./beginWork";
import { commitMutationEffects } from "./commitWork";
import { completeWork } from "./completeWork";
import { createWorkInProgress, FiberNode, FiberRootNode } from "./fiber";
import { MutationMask, NoFlags } from "./fiberFlags";
import { HostRoot } from "./workTags";

let workInProgress: FiberNode | null = null;

function prepareRefreshStack(root: FiberRootNode) {
  // 初始化
  workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
  // 在 fiber 中调度 update
  // TODO 调度功能
  const root = markUpdateFromFiberToRoot(fiber);
  renderRoot(root);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  // 个人认为是从当前要更新的 Fiber 归到根即 FiberRootNode
  let node = fiber;
  let parent = fiber.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  if (node.tag === HostRoot) {
    // 因为 hostRooterFiber 和 fiberRootNode 是靠 current 和 stateNode 连接
    return node.stateNode;
  }

  return null;
}

function renderRoot(root: FiberRootNode) {
  prepareRefreshStack(root);

  do {
    try {
      workLoop();
      break;
    } catch (e) {
      if (__DEV__) {
        console.warn("workLoop 发生错误", e);
      }
      workInProgress = null;
    }
  } while (true);

  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;

  // wip fiberNode 树 树中的 flags
  commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;

  if (finishedWork === null) {
    return;
  }

  if (__DEV__) {
    console.warn("commit 阶段开始", finishedWork);
  }

  // 重置
  root.finishedWork = null;

  // 判断是否存在 3 个子阶段需要执行的操作
  const subtreeHasEffect =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeHasEffect || rootHasEffect) {
    // 1. beforeMutation
    // 2. mutation
    commitMutationEffects(finishedWork);

    root.current = finishedWork;
    // 3. layout
  } else {
    root.current = finishedWork;
  }
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber);

  fiber.memoizedProps = fiber.pendingProps;

  if (next === null) {
    completeUnitOfWork(fiber);
  } else {
    workInProgress = next;
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber;
  do {
    completeWork(node);
    const sibling = node.sibling;
    if (sibling !== null) {
      workInProgress = sibling;
      return;
    }

    node = node.return;
    workInProgress = node;
  } while (node !== null);
}
