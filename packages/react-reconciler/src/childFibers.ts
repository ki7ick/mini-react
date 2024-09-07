/**
 * 用于性能优化
 * 比如这样的结构：
 * <div>
 *   <p>练习</p>
 *   <span>两年半</span>
 * </div>
 * 理论上会：两年半 placement , span placement, 练习 placement, p placement, div placement
 * 相比于执行5次placement，我们可以构建好「离屏DOM树」后，对 div 执行 1 次 placement 操作
 */

import type { ReactElementType } from "shared/ReactTypes";
import { createFiberFromElement, FiberNode } from "./fiber";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { HostText } from "./workTags";
import { Placement } from "./fiberFlags";

function ChildReconciler(shouldTrackEffects: boolean) {
  function reconcileSingleElement(
    returnFiber: FiberNode,
    curentFiber: FiberNode | null,
    element: ReactElementType
  ) {
    // 根据 element 创建 Fiber 并返回
    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber;
  }

  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    curentFiber: FiberNode | null,
    element: string | number
  ) {
    const fiber = new FiberNode(HostText, { content: element }, null);
    fiber.return = returnFiber;
    return fiber;
  }

  function placeSingleChild(fiber: FiberNode) {
    if (shouldTrackEffects && fiber.alternate === null) {
      // 首屏渲染
      fiber.flags |= Placement;
    }
    return fiber;
  }

  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType
  ) {
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFiber, newChild)
          );

        default:
          if (__DEV__) {
            console.warn("未实现的 reconcile 类型", newChild);
          }
          break;
      }
    }

    // TODO: 多节点情况 ul > li * 3

    if (typeof newChild === "string" || typeof newChild === "number") {
      // HostText
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild)
      );
    }

    if (__DEV__) {
      console.warn("未实现的 reconcile 类型", newChild);
    }

    return null;
  };
}

export const reconcileChildFibers = ChildReconciler(true);

export const mountChildFibers = ChildReconciler(false);
