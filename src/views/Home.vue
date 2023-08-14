<template>
  <div class="home">
    <form class="block">
      <label for="province">Province</label>
      <select v-model="province" id="province">
        <option value="AB">AB</option>
        <option value="BC">BC</option>
        <option value="NB">NB</option>
        <option value="NL">NL</option>
        <option value="NS">NS</option>
        <option value="NT">NT</option>
        <option value="NU">NU</option>
        <option value="ON">ON</option>
        <option value="PE">PE</option>
        <option value="QC">QC</option>
        <option value="SK">SK</option>
        <option value="YT">YT</option>
      </select>

      <label for="employmentIncome">Employment Income</label>
      <input v-model="employmentIncome" id="employmentIncome" type="number" />
      
      <label for="selfEmploymentIncome">Self Employment Income</label>
      <input v-model="selfEmploymentIncome" id="selfEmploymentIncome" type="number" />
      
      <label for="otherIncome">Other Income</label>
      <input v-model="otherIncome" id="otherIncome" type="number" />
      
      <label for="capitalGains">Capital Gains</label>
      <input v-model="capitalGains" id="capitalGains" type="number" />
      
      <label for="eligibleDividends">Eligible Dividends</label>
      <input v-model="eligibleDividends" id="eligibleDividends" type="number" />
      
      <label for="ineligibleDividends">Ineligible Dividends</label>
      <input v-model="ineligibleDividends" id="ineligibleDividends" type="number" />
      
      <label for="rrspDeduction">RRSP Deduction</label>
      <input v-model="rrspDeduction" id="rrspDeduction" type="number" />
      
      <label for="incomeTaxesPaid">Income Taxes Paid</label>
      <input v-model="incomeTaxesPaid" id="incomeTaxesPaid" type="number" />
    </form>
    <div class="results">
      <div class="result totalIncome">Total Income: <span class="number">${{ tax.totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span></div>
      <div class="result rrspDifference">RRSP Difference: <span class="number">${{ tax.rrspDifference.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span></div>
      <div class="result averageRate">Average Tax Rate: <span class="number">{{ (tax.averageRate * 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}%</span></div>
      <div class="result marginalRate">Marginal Tax Rate: <span class="number">{{ (tax.marginalRate * 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}%</span></div>
      <div class="result afterTaxIncome">After Tax Income: <span class="number">${{ tax.afterTaxIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span></div>
      <hr />
      <div class="result federalTax">Federal Tax: <span class="number">${{ tax.federalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span></div>
      <div class="result provincialTax">Provincial Tax: <span class="number">${{ tax.provincialTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span></div>
      <div class="result refundOrAmountOwing">{{ tax.isRefund ? "Refund" : "Amount Owing" }}: <span class="number">${{ tax.refundOrAmountOwing.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span></div>
      <div class="result payrollDeductions">CPP/EI Payroll Deductions: <span class="number">${{ tax.payrollDeductions.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span></div>
      <div v-if="tax.selfEmploymentCPPPremiums > 0" class="result selfEmploymentCPPPremiums">Self Employment CPP Premiums: <span class="number">${{ tax.selfEmploymentCPPPremiums.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span></div>
      <div class="result totalTax">Total Tax: <span class="number">${{ tax.totalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src

import { calculate } from "@/taxCalc";
import type { CalcInput } from "@/taxCalc";

const province = ref("ON" as CalcInput["province"]);
const employmentIncome = ref('0');
const selfEmploymentIncome = ref('0');
const otherIncome = ref('0');
const capitalGains = ref('0');
const eligibleDividends = ref('0');
const ineligibleDividends = ref('0');
const rrspDeduction = ref('0');
const incomeTaxesPaid = ref('0');

const tax = computed(() => calculate({
      province: province.value,
      employmentIncome: parseFloat(employmentIncome.value || "0"),
      selfEmploymentIncome: parseFloat(selfEmploymentIncome.value || "0"),
      otherIncome: parseFloat(otherIncome.value || "0"),
      capitalGains: parseFloat(capitalGains.value || "0"),
      eligibleDividends: parseFloat(eligibleDividends.value || "0"),
      ineligibleDividends: parseFloat(ineligibleDividends.value || "0"),
      rrspDeduction: parseFloat(rrspDeduction.value || "0"),
      incomeTaxesPaid: parseFloat(incomeTaxesPaid.value || "0"),
      }))
</script>

<style scoped>
.home {
  display: grid;
  grid-template-columns: [input] 5fr [resuts] 7fr;
  grid-template-rows: [main] 1fr;
  padding: 16px;
}

label, input {
  display: block;
}

select, input {
  margin-bottom: 16px;
}

.result {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.number {
  display: block;
  font-family: monospace;
  font-size: 17px;
}

.afterTaxIncome,
.averageRate,
.totalTax,
.rrspDifference {
  font-weight: bold;
}
</style>