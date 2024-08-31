<script lang="ts">
  import BooleanCriteriaForm from '$lib/BooleanCriteriaForm.svelte';
  import NumberCriteriaForm from '$lib/NumberCriteriaForm.svelte';
  import MultiSelectCriteriaForm from '$lib/MultiSelectCriteriaForm.svelte';
  import type { PageData } from './$types';
  import type { CriteriaWithKind } from '../../../model/Item';
  import { BooleanCriteria, CriteriaWithKindList, Item, ItemList, MultiSelectCriteria, NumberCriteria} from '../../../model/Item';
  import ItemTile from '$lib/ItemTile.svelte';

  export let data: PageData;
  const { category, itemPropsList, criteriaConstructorPropsWithKindList } = data;
  const itemList: Item[] = itemPropsList.map((itemProps) => new Item(itemProps));

  const items = new ItemList(itemList);

  const values: CriteriaWithKind[] = criteriaConstructorPropsWithKindList.map((criteriaConstructorPropsWithKind) => {
    switch (criteriaConstructorPropsWithKind.kind) {
      case "number":
        return {
            kind: "number",
            criteria: new NumberCriteria(criteriaConstructorPropsWithKind.props)
        };
      case "boolean":
        return {
            kind: "boolean",
            criteria: new BooleanCriteria(criteriaConstructorPropsWithKind.props)
        };
      case "multiSelect":
        return {
            kind: "multiSelect",
            criteria: new MultiSelectCriteria(criteriaConstructorPropsWithKind.props)
        }; 
    }
});

  let criteriaWithKindList = new CriteriaWithKindList(values);
  let filteredItems: Item[] = items.filterItems(criteriaWithKindList.getCriterias());
  function updateCriteriaList(criteriaWithKind: CriteriaWithKind) {
    criteriaWithKindList = criteriaWithKindList.updateCriterias(criteriaWithKind.criteria.label, criteriaWithKind);   
    filteredItems = items.filterItems(criteriaWithKindList.getCriterias());
  }
</script>


<p>{`TOP > ${category.group} > ${category.name}`}</p>
<h2>{category.name}</h2>
<!-- <p>{criteriaWithKindList.displayCriterias()}</p> -->
<div style="display: flex;">
  <div style="width: 20%;">
    <h3>絞り込み</h3>
    {#each criteriaWithKindList.values as criteriaWithKind}
      {#if criteriaWithKind.kind === "number"}
        <NumberCriteriaForm updateCriteriaList={updateCriteriaList} numberCriteria={criteriaWithKind.criteria}/>
      {:else if criteriaWithKind.kind === "boolean"}
        <BooleanCriteriaForm updateCriteriaList={updateCriteriaList} booleanCriteria={criteriaWithKind.criteria}/>
      {:else if criteriaWithKind.kind === "multiSelect"}
        <MultiSelectCriteriaForm updateCriteriaList={updateCriteriaList} multiSelectCriteria={criteriaWithKind.criteria}/>
      {/if}
    {/each}
  </div>

  <div style=" width: 80%; display: flex; flex-wrap: wrap;">
    {#each filteredItems as item}
      <ItemTile item={item}/>
    {/each}
  </div>
</div>
