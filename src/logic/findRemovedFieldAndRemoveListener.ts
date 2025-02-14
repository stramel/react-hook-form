import * as React from 'react';
import removeAllEventListeners from './removeAllEventListeners';
import getFieldValue from './getFieldValue';
import isRadioInput from '../utils/isRadioInput';
import set from '../utils/set';
import isCheckBoxInput from '../utils/isCheckBoxInput';
import isDetached from '../utils/isDetached';
import unset from '../utils/unset';
import compact from '../utils/compact';
import isUndefined from '../utils/isUndefined';
import { Field, FieldRefs, FieldValues, Ref } from '../types';

const isSameRef = (fieldValue: Field, ref: Ref) =>
  fieldValue && fieldValue.ref === ref;

export default function findRemovedFieldAndRemoveListener<
  TFieldValues extends FieldValues
>(
  fieldsRef: React.MutableRefObject<FieldRefs<TFieldValues>>,
  handleChange: ({ type, target }: Event) => Promise<void | boolean>,
  field: Field,
  shallowFieldsStateRef: React.MutableRefObject<FieldValues>,
  shouldUnregister?: boolean,
  forceDelete?: boolean,
): void {
  const {
    ref,
    ref: { name, type },
  } = field;
  const fieldRef = fieldsRef.current[name] as Field;

  if (!shouldUnregister) {
    const value = getFieldValue(fieldsRef, name, shallowFieldsStateRef);

    if (!isUndefined(value)) {
      set(shallowFieldsStateRef.current, name, value);
    }
  }

  if (!type) {
    delete fieldsRef.current[name];
    return;
  }

  if ((isRadioInput(ref) || isCheckBoxInput(ref)) && fieldRef) {
    const { options } = fieldRef;

    if (Array.isArray(options) && options.length) {
      compact(options).forEach((option, index): void => {
        const { ref } = option;
        if ((ref && isDetached(ref) && isSameRef(option, ref)) || forceDelete) {
          removeAllEventListeners(ref, handleChange);
          unset(options, `[${index}]`);
        }
      });

      if (options && !compact(options).length) {
        delete fieldsRef.current[name];
      }
    } else {
      delete fieldsRef.current[name];
    }
  } else if ((isDetached(ref) && isSameRef(fieldRef, ref)) || forceDelete) {
    removeAllEventListeners(ref, handleChange);

    delete fieldsRef.current[name];
  }
}
