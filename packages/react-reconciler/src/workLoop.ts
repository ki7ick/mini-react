import { scheduleMicroTask } from "hostConfig";
import { beginWork } from "./beginWork";
import {
  commitHookEffectListCreate,
  commitHookEffectListDestroy,
  commitHookEffectListUnmount,
  commitMutationEffects
} from "./commitWork";
import { completeWork } from "./completeWork";
import {
  createWorkInProgress,
  FiberNode,
  FiberRootNode,
  PendingPassiveEffects
} from "./fiber";
import { MutationMask, NoFlags, PassiveMask } from "./fiberFlags";
import {
  getHighestPriorityLane,
  Lane,
  markRootFinished,
  mergeLanes,
  NoLane,
  SyncLane
} from "./fiberLanes";
import { flushSyncCallbacks, scheduleSyncCallback } from "./syncTaskQueue";
import { HostRoot } from "./workTags";
import {
  unstable_scheduleCallback as scheduleCallback,
  unstable_NormalPriority as NormalPriority
} from "scheduler";
import { HookHasEffect, Passive } from "./hookEffectTags";

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffects = false;

function prepareRefreshStack(root: FiberRootNode, lane: Lane) {
  // 初始化
  workInProgress = createWorkInProgress(root.current, {});
  wipRootRenderLane = lane;
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
  // 在 fiber 中调度 update
  // TODO: 调度功能
  const root = markUpdateFromFiberToRoot(fiber);
  markRootUpdated(root, lane);
  ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root: FiberRootNode) {
  const updateLane = getHighestPriorityLane(root.pendingLanes);
  if (updateLane === NoLane) {
    return;
  }
  if (updateLane === SyncLane) {
    // 同步优先级 用微任务调度
    if (__DEV__) {
      console.log("在微任务中调度，优先级：", updateLane);
    }
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
    scheduleMicroTask(flushSyncCallbacks);
  } else {
    // 其他优先级 用宏任务调度
  }
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
  root.pendingLanes = mergeLanes(root.pendingLanes, lane);
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

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
  const nextLane = getHighestPriorityLane(root.pendingLanes);

  if (nextLane !== SyncLane) {
    // 其他比 SyncLane 低的优先级
    // NoLane
    ensureRootIsScheduled(root);
    return;
  }

  if (__DEV__) {
    console.warn("render阶段开始");
  }
  prepareRefreshStack(root, lane);

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
  root.finishedLane = lane;
  wipRootRenderLane = NoLane;

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

  const lane = root.finishedLane;

  if (lane === NoLane && __DEV__) {
    console.warn("commit 阶段finishedLane 不应该是NoLane");
  }

  // 重置
  root.finishedWork = null;
  root.finishedLane = NoLane;

  markRootFinished(root, lane);

  if (
    (finishedWork.flags & PassiveMask) !== NoFlags ||
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags
  ) {
    if (!rootDoesHasPassiveEffects) {
      rootDoesHasPassiveEffects = true;
      // 调度副作用
      scheduleCallback(NormalPriority, () => {
        // 执行副作用
        flushPassiveEffects(root.pendingPassiveEffects);
        return;
      });
    }
  }

  // 判断是否存在 3 个子阶段需要执行的操作
  const subtreeHasEffect =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeHasEffect || rootHasEffect) {
    // 1. beforeMutation
    // 2. mutation
    commitMutationEffects(finishedWork, root);

    root.current = finishedWork;
    // 3. layout
  } else {
    root.current = finishedWork;
  }

  rootDoesHasPassiveEffects = false;
  ensureRootIsScheduled(root);
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
  // 先执行完所有的destroy，再执行其他
  pendingPassiveEffects.unmount.forEach((effect) => {
    commitHookEffectListUnmount(Passive, effect);
  });
  pendingPassiveEffects.unmount = [];

  pendingPassiveEffects.update.forEach((effect) => {
    commitHookEffectListDestroy(Passive | HookHasEffect, effect);
  });

  pendingPassiveEffects.update.forEach((effect) => {
    commitHookEffectListCreate(Passive | HookHasEffect, effect);
  });
  pendingPassiveEffects.update = [];
  // 在回调过程中可能还会触发更新
  flushSyncCallbacks();
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber, wipRootRenderLane);

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
