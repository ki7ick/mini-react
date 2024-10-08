import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from "shared/ReactSymbols";
import type {
  Type,
  Key,
  Props,
  Ref,
  ReactElementType,
  ElementType
} from "shared/ReactTypes";

const ReactElement = function (
  type: Type,
  key: Key,
  ref: Ref,
  props: Props
): ReactElementType {
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

export function isValidElement(object: any) {
  return (
    typeof object === "object" &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}

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

export const Fragment = REACT_FRAGMENT_TYPE;

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
