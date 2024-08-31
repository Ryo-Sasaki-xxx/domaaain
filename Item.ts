export type CriteriaConstructorPropsWithKind = NumberCriteriaConstructorPropsWithKind | MultiSelectCriteriaConstructorPropsWithKind | BooleanCriteriaConstructorPropsWithKind;
export type NumberCriteriaConstructorPropsWithKind = {
  kind: 'number',
  props: {
    min: number;
    max: number;
    start: number;
    end: number;
    label: string;
  }
};

export type MultiSelectCriteriaConstructorPropsWithKind = {
  kind: 'multiSelect',
  props: {
    options: Record<string, {
      isActive: boolean;
      matchItemCount: number;
    }>;
    label: string;
  }
};

export type BooleanCriteriaConstructorPropsWithKind = {
  kind: 'boolean',
  props: {
    isActive: boolean;
    label: string;
  }
};

export interface Criteria<T> {
  pass(value: T): boolean;
  initialize(): Criteria<T>;
  label: string;
};

export class NumberCriteria implements Criteria<number> {
  constructor(props: {
    min: number;
    max: number;
    start: number;
    end: number;
    label: string;
  }) {
    const { min, max, start, end, label } = props;
    if ( start < min && start > max) { 
      throw new Error('start must be less than or equal to max');
    }
    if ( end < min && end > max) { 
      throw new Error('end must be less than or equal to max');
    }
    if ( start > end) {
      throw new Error('start must be less than end');
    }

    this.label = label;
    this.min = min;
    this.max = max;
    this.start = start;
    this.end = end;
  };

  readonly min: number;
  readonly max: number;
  readonly start: number;
  readonly end: number;
  readonly label: string;

  public pass(itemValue: number) {
    return itemValue >= this.start && itemValue <= this.end;
  };

  public initialize() {
    return new NumberCriteria({ label: this.label, min: this.min, max: this.max, start: this.min, end: this.max });
  };

  //debug
  public display() {
    return `${this.label}: ${this.start} ~ ${this.end}(min:${this.min} , max:${this.max})`;
  };

  public changeStart(start: number) {
    return new NumberCriteria({ label: this.label, min: this.min, max: this.max, start, end: this.end });
  };

  public changeEnd(end: number) {
    return new NumberCriteria({ label: this.label, min: this.min, max: this.max, start: this.start, end });
  };
};

export class MultiSelectCriteria implements Criteria<string> {
    constructor(props: {
        options: Record<string, {
            isActive: boolean;
            matchItemCount: number;
        }>;
        label: string;
    }) {
        const { options, label } = props;
        this.options = options;
        this.label = label;
    }

    readonly options: Record<string, {
        isActive: boolean;
        matchItemCount: number;
    }>;

    readonly label: string;

    public pass(itemValue: string) {
        if (this.activeOption().length === 0) {
            return true;
        }

        return this.activeOption().includes(itemValue);
    }

    public initialize() {
        const newOptions = Object.fromEntries(Object.entries(this.options).map(([optionLabel, { matchItemCount }]) => [optionLabel, { isActive: false, matchItemCount: matchItemCount }]));
        return new MultiSelectCriteria({ label: this.label, options: newOptions });
    }

    private activeOption() {
        return Object.entries(this.options).filter(([_, { isActive }]) => isActive).map(([optionLabel, _]) => optionLabel);
    }

    //debug
    public display() {
        return `${this.label}: ${Object.keys(this.options).filter(optionLabel => this.options[optionLabel].isActive).join(',')}`;
    }

    public reverseState(optionLabel: string) {
        const newOptions = { ...this.options };
        newOptions[optionLabel].isActive = !newOptions[optionLabel].isActive;
        return new MultiSelectCriteria({ label: this.label, options: newOptions });
    }
}

export class BooleanCriteria implements Criteria<boolean> {
    constructor(props: {
        isActive: boolean;
        label: string;
    }) {
        const { isActive, label } = props;
        this.isActive = isActive;
        this.label = label;
    }

    readonly isActive: boolean;
    readonly label: string;

    public pass(itemValue: boolean) {
        if (!this.isActive) {
            return true;
        }
        return itemValue;
    }

    public initialize() {
        return new BooleanCriteria({ label: this.label, isActive: false });
    }

    //debug
    public display() {
        return `${this.label}: ${this.isActive}`;
    }

    public reverseState() {
        return new BooleanCriteria({ label: this.label, isActive: !this.isActive });
    }
}

export type CriteriaWithKind = {
    kind: "number";
    criteria: NumberCriteria;
} | {
    kind: "boolean";
    criteria: BooleanCriteria;
} | {
    kind: "multiSelect";
    criteria: MultiSelectCriteria;
}

export class CriteriaWithKindList {
  values: CriteriaWithKind[]
    constructor(criterias: CriteriaWithKind[]) {
        this.values = criterias;
    }

    updateCriterias(label: string, newCriteriaWithKind: CriteriaWithKind) {
        const newCriterias = this.values.map(criteriaWithKind => {
            if (criteriaWithKind.criteria.label === label) {
                return newCriteriaWithKind
            }
            return criteriaWithKind;
        });

        return new CriteriaWithKindList(newCriterias);
    }

    getCriterias(): Criteria<number | string | boolean>[] {
        return this.values.map(criteriaWithKind => {
            return criteriaWithKind.criteria;
        });
    }

    // debug
    displayCriterias() {
        return this.values.map(criteriaWithKind => {
            return criteriaWithKind.criteria.display();
        });
    }
}

export type ItemValues = Record<string, number | string | boolean>;

export type ItemProps = {
    id: number;
    name: string;
    isSelected: boolean;
    itemValues: ItemValues;
}

export class Item {
    constructor(itemProps: ItemProps) {
        const { id, name, itemValues, isSelected } = itemProps;
        this.id = id
        this.name = name;
        this.itemValues = itemValues;
        this.isSelected = isSelected;
    }

    readonly id: number;
    readonly name: string;
    readonly itemValues: ItemValues;
    readonly isSelected: boolean;

    // debug
    public displayItemValues() {
        return Object.entries(this.itemValues).map(([key, value]) => `${key}: ${value}`).join(', ');
    }
}

export class ItemList {
    constructor(items: Item[]) {
        this.items = items;
    }

    readonly items: Item[];

    public filterItems(criterias: Criteria<number | string | boolean>[]) {
        return this.items.filter(item => {
            let isPassed = true;
            for (const criteria of criterias) {
                const itemValue = item.itemValues[criteria.label];
                if (itemValue !== undefined) {
                    isPassed = isPassed && criteria.pass(itemValue);
                    continue;
                }
                isPassed = isPassed && false;
            }
            return isPassed;
        });
    }
}

export type Category = {
    name: string;
    group: string;
}
