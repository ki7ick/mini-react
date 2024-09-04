import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import type {
  Type,
  Key,
  Props,
  Ref,
  ReactElement,
  ElementType
} from "shared/ReactTypes";

const ReactElement = function (
  type: Type,
  key: Key,
  ref: Ref,
  props: Props
): ReactElement {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    __mark: "kickr"
  };

  return element;
};

export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;

  for (const prop in config) {
    const val = config[prop];

    if (prop === "key") {
      if (val !== undefined) {
        key = "" + val;
      }
      continue;
    }

    if (prop === "ref") {
      if (val !== undefined) {
        ref = val;
      }
      continue;
    }

    if ({}.hasOwnProperty.call(config, prop)) {
      // 不处理原型链上的属性
      props[prop] = val;
    }
  }

  const maybeChildrenLength = maybeChildren.length;

  if (maybeChildrenLength) {
    props.children =
      maybeChildrenLength === 1 ? maybeChildren[0] : maybeChildren;
  }

  return ReactElement(type, key, ref, props);
};

export const jsxDEV = (type: ElementType, config: any) => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;

  for (const prop in config) {
    const val = config[prop];

    if (prop === "key") {
      if (val !== undefined) {
        key = "" + val;
      }
      continue;
    }

    if (prop === "ref") {
      if (val !== undefined) {
        ref = val;
      }
      continue;
    }

    if ({}.hasOwnProperty.call(config, prop)) {
      // 不处理原型链上的属性
      props[prop] = val;
    }
  }

  return ReactElement(type, key, ref, props);
};
