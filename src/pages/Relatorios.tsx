import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Loader2, Download, RefreshCw, BarChart3, Target, HardHat, DollarSign,
  Building2, Warehouse, Trophy, FileText, Calendar, Filter, Bookmark,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COR = {
  green:"#16a34a",yellow:"#B8922A",red:"#dc2626",
  blue:"#2563eb",purple:"#7c3aed",cyan:"#0891b2",orange:"#ea580c",gray:"#6b7280",
};
const PIE_COLORS=[COR.green,COR.yellow,COR.red,COR.blue,COR.purple,COR.cyan];

const MODULOS=[
  {key:"completo",     label:"Relatório Completo",        icon:BarChart3 },
  {key:"metas",        label:"Metas",                     icon:Target    },
  {key:"execucao",     label:"Execução de Obra",           icon:HardHat   },
  {key:"financeiro",   label:"Financeiro",                icon:DollarSign},
  {key:"obras",        label:"Obras e Empreendimentos",   icon:Building2 },
  {key:"almoxarifado", label:"Almoxarifado",              icon:Warehouse },
  {key:"ranking",      label:"Ranking de Equipe",         icon:Trophy    },
  {key:"diario",       label:"Diário de Obra (RDO)",      icon:Bookmark},
];

const fmt  = (n:number)=>n.toLocaleString("pt-BR");
const fmtR = (n:number)=>`R$ ${n.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const pct  = (a:number,b:number)=>(b>0?Math.round((a/b)*100):0);

function KpiCard({label,value,sub,color=COR.blue}:{label:string;value:string|number;sub?:string;color?:string}){
  return(
    <div className="erp-card p-4 rounded-lg border border-border flex flex-col gap-1">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xl font-bold" style={{color}}>{value}</p>
      {sub&&<p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SecTitle({icon:Icon,title,color=COR.blue}:{icon:any;title:string;color?:string}){
  return(
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
      <Icon className="w-4 h-4" style={{color}}/>
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
    </div>
  );
}

// ── METAS ─────────────────────────────────────────────────────────────────────
function RelMetas({data}:{data:any}){
  if(!data)return null;
  const {metas=[],checkins=[],anoFiltro=""}=data;
  const total=metas.length;
  const atingidas=metas.filter((m:any)=>m.status==="atingida").length;
  const emRisco=metas.filter((m:any)=>m.status==="em_risco").length;
  const noPrazo=metas.filter((m:any)=>m.status==="no_prazo").length;
  const atencao=metas.filter((m:any)=>m.status==="atencao").length;
  const qualitativas=metas.filter((m:any)=>m.unidade==="texto"||m.tipo_meta==="qualitativa").length;
  const prazoVencidas=metas.filter((m:any)=>m.prazo&&new Date(m.prazo)<new Date()&&m.status!=="atingida").length;
  const porCat=Object.entries(metas.reduce((acc:any,m:any)=>{
    acc[m.categoria||"Sem categoria"]=(acc[m.categoria||"Sem categoria"]||0)+1;return acc;
  },{})).map(([name,value])=>({name,value}));
  const statusData=[
    {name:"Atingidas",value:atingidas,color:COR.green},
    {name:"No Prazo", value:noPrazo,  color:COR.blue },
    {name:"Atenção",  value:atencao,  color:COR.yellow},
    {name:"Em Risco", value:emRisco,  color:COR.red  },
  ].filter(s=>s.value>0);
  const scMap:Record<string,string>={atingida:COR.green,no_prazo:COR.blue,atencao:COR.yellow,em_risco:COR.red};
  const slMap:Record<string,string>={atingida:"Atingida",no_prazo:"No Prazo",atencao:"Atenção",em_risco:"Em Risco"};
  return(
    <div className="space-y-5">
      <SecTitle icon={Target} title={`Metas${anoFiltro?" — "+anoFiltro:""}`} color={COR.purple}/>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total"         value={total}            color={COR.blue}/>
        <KpiCard label="Atingidas"     value={atingidas}        sub={`${pct(atingidas,total)}%`}    color={COR.green}/>
        <KpiCard label="Em Risco"      value={emRisco}          sub={`${pct(emRisco,total)}%`}      color={COR.red}/>
        <KpiCard label="Qualitativas"  value={qualitativas}     sub={`${pct(qualitativas,total)}%`} color={COR.purple}/>
        <KpiCard label="Prazo Vencido" value={prazoVencidas}    sub={prazoVencidas>0?"⚠ atenção!":""} color={prazoVencidas>0?COR.red:COR.green}/>
        <KpiCard label="Check-ins"     value={checkins.length}  color={COR.cyan}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statusData.length>0&&(
          <div className="erp-card p-4 rounded-lg border border-border">
            <p className="text-[11px] font-semibold mb-3">Status das Metas</p>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                  {statusData.map((s,i)=><Cell key={i} fill={s.color}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {porCat.length>0&&(
          <div className="erp-card p-4 rounded-lg border border-border">
            <p className="text-[11px] font-semibold mb-3">Metas por Categoria</p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={porCat} margin={{top:0,right:10,left:-20,bottom:35}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis dataKey="name" tick={{fontSize:8}} angle={-35} textAnchor="end"/>
                <YAxis tick={{fontSize:9}}/>
                <Tooltip/>
                <Bar dataKey="value" fill={COR.purple} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {/* Mapa de Saúde por Categoria — dinâmico, baseado nas categorias reais */}
      {porCat.length>0&&(
        <div className="erp-card p-4 rounded-lg border border-border">
          <p className="text-[11px] font-semibold mb-3">Mapa de Saúde por Categoria</p>
          <div className={`grid gap-2 ${porCat.length<=4?"grid-cols-2 sm:grid-cols-4":porCat.length<=6?"grid-cols-2 sm:grid-cols-3 lg:grid-cols-6":"grid-cols-2 sm:grid-cols-4 lg:grid-cols-8"}`}>
            {porCat.map((cat:any,idx:number)=>{
              const PALETTE=[COR.blue,COR.cyan,COR.yellow,COR.orange,COR.purple,COR.green,COR.red,"hsl(330,70%,50%)"];
              const col=PALETTE[idx%PALETTE.length];
              const catMetas=metas.filter((m:any)=>(m.categoria||"Sem categoria")===cat.name);
              const catAting=catMetas.filter((m:any)=>m.status==="atingida").length;
              const catPct=Math.round((catAting/catMetas.length)*100);
              const statusLabel=catPct>=75?"Ótimo":catPct>=50?"Regular":"Atenção";
              const statusCor=catPct>=75?COR.green:catPct>=50?COR.yellow:COR.red;
              return(
                <div key={cat.name} className="rounded p-3 text-center"
                     style={{background:`${col}12`,border:`1px solid ${col}30`}}>
                  <p className="text-[10px] font-semibold text-foreground mb-1 truncate" title={cat.name}>{cat.name}</p>
                  <p className="text-lg font-bold" style={{color:col}}>{catPct}%</p>
                  <p className="text-[9px] font-medium mt-0.5" style={{color:statusCor}}>{statusLabel}</p>
                  <p className="text-[9px] text-muted-foreground">{catAting}/{catMetas.length}</p>
                  <div className="h-1 rounded-full bg-secondary overflow-hidden mt-1.5">
                    <div className="h-full rounded-full" style={{width:`${catPct}%`,background:col}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="erp-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <p className="text-[11px] font-semibold">Listagem de Metas ({total})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border">{["Nome","Tipo","Categoria","Responsável","Progresso","Status","Prazo"].map(h=><th key={h} className="py-2 px-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {metas.slice(0,30).map((m:any)=>{
                const p=m.objetivo>0?Math.min(Math.round((m.atual/m.objetivo)*100),100):0;
                const isQual=m.unidade==="texto"||m.tipo_meta==="qualitativa";
                const prazoVencido=m.prazo&&new Date(m.prazo)<new Date()&&m.status!=="atingida";
                const rowBg=prazoVencido?"hsl(0,72%,51%,0.05)":"";
                return(
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20" style={{background:rowBg}}>
                    <td className="py-1.5 px-3 font-medium text-foreground max-w-[180px] truncate">
                      {m.nome}
                      {prazoVencido&&<span className="ml-1 text-[9px] text-red-400">⚠ vencida</span>}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{background:isQual?"hsl(271,60%,55%,0.15)":"hsl(207,89%,48%,0.15)",
                                color:isQual?"hsl(271,60%,55%)":"hsl(207,89%,48%)"}}>
                        {isQual?"Qualit.":"Quant."}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-muted-foreground">{m.categoria||"—"}</td>
                    <td className="py-1.5 px-3 text-muted-foreground">{m.responsavel||"—"}</td>
                    <td className="py-1.5 px-3">
                      {isQual?(
                        <span className="text-[10px] text-muted-foreground italic">
                          {m.status==="atingida"?"✓ Concluída":"Pendente"}
                        </span>
                      ):(
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${p}%`,background:scMap[m.status]||COR.gray}}/>
                          </div>
                          <span className="text-[10px] font-medium w-8 text-right">{p}%</span>
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{background:`${scMap[m.status]||COR.gray}20`,color:scMap[m.status]||COR.gray}}>
                        {slMap[m.status]||m.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-[10px]" style={{color:prazoVencido?COR.red:"hsl(var(--muted-foreground))"}}>
                      {m.prazo?new Date(m.prazo).toLocaleDateString("pt-BR"):"—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── EXECUÇÃO ──────────────────────────────────────────────────────────────────
function RelExecucao({data}:{data:any}){
  if(!data)return null;
  const obras=data.obras??[];
  const metasObra=data.metasObra??[];
  const porEtapa=Object.entries(obras.reduce((acc:any,o:any)=>{acc[o.etapa_atual]=(acc[o.etapa_atual]||0)+1;return acc;},{})).map(([name,value])=>({name,value}));
  const media=obras.length>0?Math.round(obras.reduce((s:number,o:any)=>s+(o.progresso||0),0)/obras.length):0;
  const progressoSugerido=(obraId:string)=>{
    const om=metasObra.filter((m:any)=>m.obra_id===obraId);
    if(om.length===0)return null;
    return Math.round(om.filter((m:any)=>m.status==="atingida").length/om.length*100);
  };
  const atrasadas=obras.filter((o:any)=>o.data_prevista&&new Date(o.data_prevista)<new Date()&&o.progresso<100).length;
  return(
    <div className="space-y-5">
      <SecTitle icon={HardHat} title="Execução de Obra" color={COR.orange}/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total de Obras"   value={obras.length}  color={COR.blue}/>
        <KpiCard label="Progresso Médio"  value={`${media}%`}   color={COR.green}/>
        <KpiCard label="Atrasadas"        value={atrasadas}     color={atrasadas>0?COR.red:COR.green} sub={atrasadas>0?"prazo vencido":""}/>
        <KpiCard label="Metas Vinculadas" value={metasObra.length} color={COR.purple}/>
      </div>
      {porEtapa.length>0&&(
        <div className="erp-card p-4 rounded-lg border border-border">
          <p className="text-[11px] font-semibold mb-3">Obras por Etapa</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={porEtapa} margin={{top:0,right:10,left:-20,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
              <XAxis dataKey="name" tick={{fontSize:8}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fontSize:9}}/>
              <Tooltip/>
              <Bar dataKey="value" fill={COR.orange} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="erp-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <p className="text-[11px] font-semibold">Obras ({obras.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border">{["Nome","Etapa","Responsável","Progresso","Previsão"].map(h=><th key={h} className="py-2 px-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {obras.map((o:any)=>{
                const sug=progressoSugerido(o.id);
                const atrasada=o.data_prevista&&new Date(o.data_prevista)<new Date()&&o.progresso<100;
                return(
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20"
                    style={{background:atrasada?"hsl(0,72%,51%,0.05)":""}}>
                  <td className="py-1.5 px-3 font-medium text-foreground">
                    {o.nome}
                    {atrasada&&<span className="ml-1 text-[9px] text-red-400">⚠ atrasada</span>}
                  </td>
                  <td className="py-1.5 px-3 text-muted-foreground">{o.etapa_atual}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{o.responsavel||"—"}</td>
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${o.progresso}%`,background:o.progresso>=100?COR.green:o.progresso>=50?COR.blue:COR.orange}}/>
                      </div>
                      <span className="text-[10px] w-8 text-right">{o.progresso}%</span>
                    </div>
                    {sug!==null&&sug!==o.progresso&&(
                      <p className="text-[9px] mt-0.5" style={{color:"hsl(var(--muted-foreground))"}}>
                        Sugerido por metas: <strong>{sug}%</strong>
                      </p>
                    )}
                  </td>
                  <td className="py-1.5 px-3 text-[10px]" style={{color:atrasada?COR.red:"hsl(var(--muted-foreground))"}}>
                    {o.data_prevista?new Date(o.data_prevista).toLocaleDateString("pt-BR"):"—"}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── FINANCEIRO ────────────────────────────────────────────────────────────────
function RelFinanceiro({data}:{data:any}){
  if(!data)return null;
  const {faturamentos=[],contasPagar=[],contasReceber=[],anoFiltro=""}=data;
  const totalFat=faturamentos.reduce((s:number,f:any)=>s+Number(f.valor||0),0);
  const totalPag=contasPagar.reduce((s:number,c:any)=>s+Number(c.valor||0),0);
  const totalRec=contasReceber.reduce((s:number,c:any)=>s+Number(c.valor||0),0);
  const saldo=totalFat+totalRec-totalPag;
  const pagarPorStatus=[
    {name:"Pendente",value:contasPagar.filter((c:any)=>c.status==="pendente").reduce((s:number,c:any)=>s+Number(c.valor||0),0),color:COR.yellow},
    {name:"Pago",    value:contasPagar.filter((c:any)=>c.status==="pago").reduce((s:number,c:any)=>s+Number(c.valor||0),0),    color:COR.green},
    {name:"Vencido", value:contasPagar.filter((c:any)=>c.status==="vencido").reduce((s:number,c:any)=>s+Number(c.valor||0),0), color:COR.red},
  ].filter(s=>s.value>0);
  return(
    <div className="space-y-5">
      <SecTitle icon={DollarSign} title={`Financeiro${anoFiltro?" — "+anoFiltro:""}`} color={COR.green}/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Faturamento"    value={fmtR(totalFat)} color={COR.green}/>
        <KpiCard label="A Pagar"        value={fmtR(totalPag)} color={COR.red}/>
        <KpiCard label="A Receber"      value={fmtR(totalRec)} color={COR.blue}/>
        <KpiCard label="Saldo Líquido"  value={fmtR(saldo)}    color={saldo>=0?COR.green:COR.red}/>
      </div>
      {pagarPorStatus.length>0&&(
        <div className="erp-card p-4 rounded-lg border border-border">
          <p className="text-[11px] font-semibold mb-3">Contas a Pagar por Status (R$)</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pagarPorStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}
                label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {pagarPorStatus.map((s,i)=><Cell key={i} fill={s.color}/>)}
              </Pie>
              <Tooltip formatter={(v:any)=>fmtR(v)}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="erp-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <p className="text-[11px] font-semibold">Notas Fiscais ({faturamentos.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border">{["Número","Cliente","Emissão","Valor","Status"].map(h=><th key={h} className="py-2 px-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {faturamentos.slice(0,20).map((f:any)=>(
                <tr key={f.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-1.5 px-3 font-medium text-blue-400">{f.numero}</td>
                  <td className="py-1.5 px-3 text-foreground">{f.cliente}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{f.data_emissao?new Date(f.data_emissao).toLocaleDateString("pt-BR"):"—"}</td>
                  <td className="py-1.5 px-3 font-medium">{fmtR(Number(f.valor||0))}</td>
                  <td className="py-1.5 px-3"><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{background:`${f.status==="pago"?COR.green:COR.yellow}20`,color:f.status==="pago"?COR.green:COR.yellow}}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── OBRAS ─────────────────────────────────────────────────────────────────────
function RelObras({data}:{data:any}){
  if(!data)return null;
  const {empreendimentos=[],contratos=[],materiais=[]}=data;
  const totalCont=contratos.reduce((s:number,c:any)=>s+Number(c.valor||0),0);
  const porFase=Object.entries(empreendimentos.reduce((acc:any,e:any)=>{acc[e.fase||"Outro"]=(acc[e.fase||"Outro"]||0)+1;return acc;},{})).map(([name,value])=>({name,value}));
  const matCriticos=materiais.filter((m:any)=>Number(m.quantidade)<=Number(m.minimo)).length;
  return(
    <div className="space-y-5">
      <SecTitle icon={Building2} title="Obras e Empreendimentos" color={COR.blue}/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Empreendimentos" value={empreendimentos.length} color={COR.blue}/>
        <KpiCard label="Contratos"       value={contratos.length}       color={COR.purple}/>
        <KpiCard label="Valor Contratos" value={fmtR(totalCont)}        color={COR.green}/>
        <KpiCard label="Mat. Críticos"   value={matCriticos}            color={matCriticos>0?COR.red:COR.green}/>
      </div>
      {porFase.length>0&&(
        <div className="erp-card p-4 rounded-lg border border-border">
          <p className="text-[11px] font-semibold mb-3">Empreendimentos por Fase</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={porFase} margin={{top:0,right:10,left:-20,bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
              <XAxis dataKey="name" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:9}}/>
              <Tooltip/>
              <Bar dataKey="value" fill={COR.blue} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="erp-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <p className="text-[11px] font-semibold">Empreendimentos ({empreendimentos.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border">{["Nome","Fase","Unidades","Vendidas","Status"].map(h=><th key={h} className="py-2 px-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {empreendimentos.map((e:any)=>(
                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-1.5 px-3 font-medium text-foreground">{e.nome}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{e.fase}</td>
                  <td className="py-1.5 px-3 text-right text-muted-foreground">{e.unidades}</td>
                  <td className="py-1.5 px-3 text-right text-muted-foreground">{e.vendidas}</td>
                  <td className="py-1.5 px-3"><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── ALMOXARIFADO ──────────────────────────────────────────────────────────────
function RelAlmox({data}:{data:any}){
  if(!data)return null;
  const {ativos=[],envios=[],destinos=[]}=data;
  const porPadrao=Object.entries(ativos.reduce((acc:any,a:any)=>{acc[a.padrao||"Outro"]=(acc[a.padrao||"Outro"]||0)+1;return acc;},{})).map(([name,value])=>({name,value}));
  return(
    <div className="space-y-5">
      <SecTitle icon={Warehouse} title="Almoxarifado" color={COR.cyan}/>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="Total de Ativos"   value={ativos.length}   color={COR.cyan}/>
        <KpiCard label="Envios Realizados" value={envios.length}   color={COR.blue}/>
        <KpiCard label="Destinos Ativos"   value={destinos.length} color={COR.purple}/>
      </div>
      {porPadrao.length>0&&(
        <div className="erp-card p-4 rounded-lg border border-border">
          <p className="text-[11px] font-semibold mb-3">Ativos por Padrão</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={porPadrao} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}
                label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {porPadrao.map((_:any,i:number)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="erp-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <p className="text-[11px] font-semibold">Ativos ({ativos.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border">{["Código","Nome","Ativo","Padrão"].map(h=><th key={h} className="py-2 px-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {ativos.slice(0,30).map((a:any)=>(
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-1.5 px-3 font-medium text-blue-400">{a.codigo_remo}</td>
                  <td className="py-1.5 px-3 text-foreground">{a.nome}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{a.ativo}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{a.padrao||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {envios.length>0&&(
        <div className="erp-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <p className="text-[11px] font-semibold">Envios Recentes ({envios.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="border-b border-border">{["Ativo","Destino","Data","Responsável"].map(h=><th key={h} className="py-2 px-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {envios.slice(0,20).map((e:any)=>(
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-1.5 px-3 text-foreground">{(e.ativos_remo as any)?.nome||e.ativo_id}</td>
                    <td className="py-1.5 px-3 text-muted-foreground">{(e.ativos_destinos as any)?.nome||e.destino_id}</td>
                    <td className="py-1.5 px-3 text-muted-foreground">{e.created_at?new Date(e.created_at).toLocaleDateString("pt-BR"):"—"}</td>
                    <td className="py-1.5 px-3 text-muted-foreground">{e.responsavel||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DIÁRIO DE OBRA ────────────────────────────────────────────────────────────
function RelDiario({data}:{data:any}){
  if(!data)return null;
  const{diarios=[]}=data;
  const total=diarios.length;
  const totalTrab=diarios.reduce((s:number,d:any)=>s+(d.total_trabalhadores||0),0);
  const totalHH=diarios.reduce((s:number,d:any)=>s+Number(d.horas_trabalhadas||0),0);
  const comOcorr=diarios.filter((d:any)=>d.ocorrencias?.trim()).length;
  const porClima=diarios.reduce((acc:any,d:any)=>{
    acc[d.clima_manha]=(acc[d.clima_manha]||0)+1; return acc;
  },{});
  const COR_DIARIO={gold:"hsl(42,65%,56%)",blue:"hsl(210,80%,48%)",teal:"hsl(174,62%,47%)",red:"hsl(0,72%,51%)"};
  return(
    <div className="space-y-4">
      <SecTitle icon={Bookmark} title="Diário de Obra (RDO)" color={COR_DIARIO.gold}/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total de RDOs"         value={total}           color={COR_DIARIO.blue}/>
        <KpiCard label="Trabalhadores (total)"  value={totalTrab}       color={COR_DIARIO.gold}/>
        <KpiCard label="Homem-hora total"       value={`${totalHH}h`}   color={COR_DIARIO.teal}/>
        <KpiCard label="Com ocorrências"        value={comOcorr}        color={COR_DIARIO.red}/>
      </div>
      {Object.keys(porClima).length>0&&(
        <div className="erp-card p-4 rounded-lg border border-border">
          <p className="text-[11px] font-semibold text-foreground mb-3">Clima predominante (manhã)</p>
          <div className="space-y-1.5">
            {Object.entries(porClima).map(([k,v]:any)=>(
              <div key={k} className="flex items-center gap-2 text-[11px]">
                <span className="w-24 text-muted-foreground capitalize">{k.replace("_"," ")}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${total>0?Math.round((v/total)*100):0}%`,background:COR_DIARIO.gold}}/>
                </div>
                <span className="text-muted-foreground w-8 text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="erp-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["Data","Obra","Trabalhadores","H/H","Clima","Ocorrência"].map(h=>(
                <th key={h} className="py-2 px-3 text-left font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diarios.slice(0,50).map((d:any)=>(
              <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/50">
                <td className="py-1.5 px-3 text-muted-foreground">{d.data_registro}</td>
                <td className="py-1.5 px-3 font-medium max-w-[140px] truncate">{d.obra_nome}</td>
                <td className="py-1.5 px-3">{d.total_trabalhadores}</td>
                <td className="py-1.5 px-3">{d.horas_trabalhadas}h</td>
                <td className="py-1.5 px-3 capitalize">{d.clima_manha?.replace("_"," ")}</td>
                <td className="py-1.5 px-3">
                  {d.ocorrencias?.trim()
                    ? <span style={{color:"hsl(0,72%,51%)",fontSize:10}}>Sim</span>
                    : <span className="text-muted-foreground text-[10px]">Não</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {diarios.length>50&&<p className="text-[10px] text-muted-foreground text-center py-2">Mostrando 50 de {diarios.length} registros</p>}
      </div>
    </div>
  );
}

// ── RANKING ───────────────────────────────────────────────────────────────────
function RelRanking({data}:{data:any}){
  if(!data)return null;
  const ranking=data.ranking??[];
  const medals=["🥇","🥈","🥉"];
  return(
    <div className="space-y-5">
      <SecTitle icon={Trophy} title="Ranking de Equipe" color={COR.yellow}/>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="Colaboradores" value={ranking.length} color={COR.blue}/>
        <KpiCard label="Melhor Taxa"   value={ranking[0]?`${ranking[0].taxa_sucesso}%`:"—"} color={COR.green}/>
        <KpiCard label="Total Pontos"  value={fmt(ranking.reduce((s:number,r:any)=>s+(r.pontos_gamificacao||0),0))} color={COR.yellow}/>
      </div>
      {ranking.length>0&&(
        <div className="erp-card p-4 rounded-lg border border-border">
          <p className="text-[11px] font-semibold mb-3">Taxa de Sucesso por Colaborador (Top 10)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ranking.slice(0,10)} margin={{top:0,right:10,left:-20,bottom:45}}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
              <XAxis dataKey="user_name" tick={{fontSize:8}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fontSize:9}} domain={[0,100]}/>
              <Tooltip formatter={(v:any)=>`${v}%`}/>
              <Bar dataKey="taxa_sucesso" fill={COR.yellow} radius={[3,3,0,0]} name="Taxa %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="erp-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <p className="text-[11px] font-semibold">Classificação</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border">{["Pos","Nome","Concluídas","Taxa","Pontos"].map(h=><th key={h} className="py-2 px-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {ranking.map((r:any,i:number)=>(
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-1.5 px-3 text-base">{medals[i]||`${i+1}º`}</td>
                  <td className="py-1.5 px-3 font-medium text-foreground">{r.user_name}</td>
                  <td className="py-1.5 px-3 text-center text-muted-foreground">{r.metas_concluidas}</td>
                  <td className="py-1.5 px-3 font-bold" style={{color:r.taxa_sucesso>=80?COR.green:r.taxa_sucesso>=50?COR.yellow:COR.red}}>{r.taxa_sucesso}%</td>
                  <td className="py-1.5 px-3 font-medium text-yellow-400">{fmt(r.pontos_gamificacao||0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function Relatorios(){
  const {toast}=useToast();
  const [modulo,setModulo]         = useState("completo");
  const [loading,setLoading]       = useState(false);
  const [exporting,setExporting]   = useState(false);
  const [dataInicio,setDataInicio] = useState("");
  const [dataFim,setDataFim]       = useState("");
  const [anoFiltro,setAnoFiltro]   = useState(String(new Date().getFullYear()));

  // Anos dinâmicos baseados no ano atual
  const anoAtual = new Date().getFullYear();
  const ANOS_DISPONIVEIS = Array.from({length:4},(_,i)=>String(anoAtual-1+i));

  const [dadosMetas,setDadosMetas]           = useState<any>(null);
  const [dadosExecucao,setDadosExecucao]     = useState<any>(null);
  const [dadosFinanceiro,setDadosFinanceiro] = useState<any>(null);
  const [dadosObras,setDadosObras]           = useState<any>(null);
  const [dadosAlmox,setDadosAlmox]           = useState<any>(null);
  const [dadosDiario,setDadosDiario]         = useState<any>(null);
  const [dadosRanking,setDadosRanking]       = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const applyDate=(q:any,col="created_at")=>{
    if(dataInicio)q=q.gte(col,dataInicio);
    if(dataFim)   q=q.lte(col,dataFim+"T23:59:59");
    return q;
  };

  const loadMetas=useCallback(async()=>{
    const[{data:metas},{data:checkins}]=await Promise.all([
      applyDate(supabase.from("metas").select("*").order("created_at",{ascending:false})),
      supabase.from("meta_checkins").select("*"),
    ]);
    let metasFiltradas=metas??[];
    if(!dataInicio&&!dataFim&&anoFiltro){
      metasFiltradas=metasFiltradas.filter((m:any)=>{
        const d=new Date(m.created_at);
        return d.getFullYear()===parseInt(anoFiltro);
      });
    }
    setDadosMetas({metas:metasFiltradas,checkins:checkins??[],anoFiltro});
  },[dataInicio,dataFim,anoFiltro]);

  const loadExecucao=useCallback(async()=>{
    const{data:obras}=await applyDate(supabase.from("execucao_obras").select("*").order("created_at",{ascending:false}));
    const obraIds=(obras??[]).map((o:any)=>o.id).filter(Boolean);
    let metasObra:any[]=[];
    if(obraIds.length>0){
      const{data:mo}=await supabase.from("metas").select("id,nome,status,etapa,obra_id,responsavel").in("obra_id",obraIds);
      metasObra=mo??[];
    }
    setDadosExecucao({obras:obras??[],metasObra});
  },[dataInicio,dataFim]);

  const loadFinanceiro=useCallback(async()=>{
    let qFat=supabase.from("faturamento").select("*").order("data_emissao",{ascending:false});
    let qPag=supabase.from("contas_pagar").select("*").order("data_vencimento",{ascending:false});
    let qRec=supabase.from("contas_receber").select("*").order("data_vencimento",{ascending:false});
    if(dataInicio||dataFim){
      qFat=applyDate(qFat,"data_emissao") as any;
      qPag=applyDate(qPag,"data_vencimento") as any;
      qRec=applyDate(qRec,"data_vencimento") as any;
    } else if(anoFiltro){
      const ini=`${anoFiltro}-01-01`, fim=`${anoFiltro}-12-31`;
      qFat=qFat.gte("data_emissao",ini).lte("data_emissao",fim) as any;
      qPag=qPag.gte("data_vencimento",ini).lte("data_vencimento",fim) as any;
      qRec=qRec.gte("data_vencimento",ini).lte("data_vencimento",fim) as any;
    }
    const[{data:fat},{data:pagar},{data:receber}]=await Promise.all([qFat,qPag,qRec]);
    setDadosFinanceiro({faturamentos:fat??[],contasPagar:pagar??[],contasReceber:receber??[],anoFiltro});
  },[dataInicio,dataFim,anoFiltro]);

  const loadObras=useCallback(async()=>{
    const[{data:emp},{data:cont},{data:mat}]=await Promise.all([
      supabase.from("empreendimentos").select("*").order("created_at",{ascending:false}),
      supabase.from("contratos").select("*").order("created_at",{ascending:false}),
      supabase.from("materiais").select("*").order("created_at",{ascending:false}),
    ]);
    setDadosObras({empreendimentos:emp??[],contratos:cont??[],materiais:mat??[]});
  },[]);

  const loadAlmox=useCallback(async()=>{
    const[{data:ativos},{data:envios},{data:destinos}]=await Promise.all([
      supabase.from("ativos_remo").select("*").order("created_at",{ascending:false}),
      supabase.from("ativos_envios").select("*, ativos_remo(nome), ativos_destinos(nome)").order("created_at",{ascending:false}),
      supabase.from("ativos_destinos").select("*"),
    ]);
    setDadosAlmox({ativos:ativos??[],envios:envios??[],destinos:destinos??[]});
  },[]);

  const loadDiario=useCallback(async()=>{
    const{data:diarios}=await applyDate(supabase.from("diario_obra").select("*").order("data_registro",{ascending:false}),"data_registro");
    setDadosDiario({diarios:diarios??[]});
  },[dataInicio,dataFim]);

  const loadRanking=useCallback(async()=>{
    const mesAno=dataInicio?dataInicio.slice(0,7):new Date().toISOString().slice(0,7);
    const{data:ranking}=await supabase.from("responsavel_performance").select("*").eq("mes_ano",mesAno).order("taxa_sucesso",{ascending:false});
    setDadosRanking({ranking:ranking??[]});
  },[dataInicio]);

  const carregar=useCallback(async()=>{
    setLoading(true);
    try{
      if(modulo==="completo")
        await Promise.all([loadMetas(),loadExecucao(),loadFinanceiro(),loadObras(),loadAlmox(),loadDiario(),loadRanking()]);
      else if(modulo==="metas")        await loadMetas();
      else if(modulo==="execucao")     await loadExecucao();
      else if(modulo==="financeiro")   await loadFinanceiro();
      else if(modulo==="obras")        await loadObras();
      else if(modulo==="almoxarifado") await loadAlmox();
      else if(modulo==="diario")       await loadDiario();
      else if(modulo==="ranking")      await loadRanking();
    }catch{toast({title:"Erro ao carregar dados",variant:"destructive"});}
    finally{setLoading(false);}
  },[modulo,loadMetas,loadExecucao,loadFinanceiro,loadObras,loadAlmox,loadRanking]);

  useEffect(()=>{carregar();},[carregar]);

  // ── EXPORTAR PDF COM TEXTOS LEGÍVEIS ────────────────────────────────────────
  const handleExportPDF=async()=>{
    if(!reportRef.current)return;
    setExporting(true);
    try{
      const el=reportRef.current;

      // 1. Injeta <style> temporário que sobrescreve as CSS variables do tema escuro
      //    para valores claros (tema light), garantindo texto legível no PDF.
      const styleOverride=document.createElement("style");
      styleOverride.id="pdf-export-override";
      styleOverride.textContent=`
        :root, [data-theme], .dark, [class*="dark"] {
          --background: 0 0% 100% !important;
          --foreground: 0 0% 0% !important;
          --muted-foreground: 220 9% 23% !important;
          --card: 0 0% 100% !important;
          --card-foreground: 0 0% 0% !important;
          --border: 214 32% 75% !important;
          --secondary: 210 40% 94% !important;
          --secondary-foreground: 0 0% 0% !important;
          --muted: 210 40% 94% !important;
          --accent: 210 40% 94% !important;
          --popover: 0 0% 100% !important;
          --popover-foreground: 0 0% 0% !important;
        }
        /* Fundo branco nos cards e tabelas */
        .erp-card, thead, th {
          background-color: #f8fafc !important;
        }
        /* Texto principal — preto puro */
        p, td, h1, h2, h3, h4, strong {
          color: #000000 !important;
        }
        /* Texto secundário — cinza grafite */
        th, label, small {
          color: #374151 !important;
        }
        /* Fonte maior apenas em tabelas (td, th) e parágrafos de listagem */
        table td, table th {
          font-size: 13px !important;
        }
        /* Preserva cores de status inline (verde, vermelho, amarelo, azul, roxo, etc) */
        [style*="color: #16a34a"], [style*="color:#16a34a"] { color: #16a34a !important; }
        [style*="color: #dc2626"], [style*="color:#dc2626"] { color: #dc2626 !important; }
        [style*="color: #B8922A"], [style*="color:#B8922A"] { color: #B8922A !important; }
        [style*="color: #2563eb"], [style*="color:#2563eb"] { color: #2563eb !important; }
        [style*="color: #7c3aed"], [style*="color:#7c3aed"] { color: #7c3aed !important; }
        [style*="color: #0891b2"], [style*="color:#0891b2"] { color: #0891b2 !important; }
        [style*="color: #ea580c"], [style*="color:#ea580c"] { color: #ea580c !important; }
        /* Preserva tamanhos dos cards do Mapa de Saúde (texto com font-size inline) */
        [style*="font-size"] { font-size: unset !important; }
        .text-lg, .text-xl, .text-base { font-size: revert !important; }
      `;
      document.head.appendChild(styleOverride);

      // 2. Desativa overflow-x em todos os elementos com scroll horizontal
      //    para que html2canvas capture o conteúdo completo sem cortes
      const scrollEls=el.querySelectorAll<HTMLElement>("[class*='overflow']");
      const prevOverflows:string[]=[];
      scrollEls.forEach((s)=>{
        prevOverflows.push(s.style.overflow);
        s.style.overflow="visible";
      });

      // 3. Aguarda o browser repintar com os novos estilos
      await new Promise(resolve=>setTimeout(resolve,150));

      // 4. Captura com fundo branco e largura total do conteúdo
      const canvas=await html2canvas(el,{
        scale:1.5,
        useCORS:true,
        backgroundColor:"#ffffff",
        logging:false,
        width:el.scrollWidth,
        height:el.scrollHeight,
        windowWidth:el.scrollWidth,
      });

      // 5. Remove o style temporário e restaura overflow — volta tema original
      document.head.removeChild(styleOverride);
      scrollEls.forEach((s,i)=>{s.style.overflow=prevOverflows[i];});

      // 7. Gerar PDF
      const imgData=canvas.toDataURL("image/png");
      const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const pageW=210,pageH=297;
      const imgH=(canvas.height*pageW)/canvas.width;
      let heightLeft=imgH,pos=0;

      // Cabeçalho — fundo escuro com texto branco
      pdf.setFillColor(27,42,74);
      pdf.rect(0,0,pageW,12,"F");
      pdf.setFontSize(9);
      pdf.setTextColor(255,255,255);
      const lbl=MODULOS.find(m=>m.key===modulo)?.label??"Relatório";
      pdf.text(`San Remo ERP — ${lbl}`,8,8);
      pdf.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`,pageW-8,8,{align:"right"});

      pdf.addImage(imgData,"PNG",0,14,pageW,imgH);
      heightLeft-=pageH-14;

      while(heightLeft>0){
        pos-=pageH;
        pdf.addPage();
        pdf.setFillColor(27,42,74);
        pdf.rect(0,0,pageW,12,"F");
        pdf.setTextColor(255,255,255);
        pdf.text(`San Remo ERP — ${lbl}`,8,8);
        pdf.addImage(imgData,"PNG",0,pos+14,pageW,imgH);
        heightLeft-=pageH;
      }

      const slug=dataInicio?`_${dataInicio}`:"";
      pdf.save(`relatorio_${modulo}${slug}_${new Date().toISOString().slice(0,10)}.pdf`);
      toast({title:"PDF exportado com sucesso!"});
    }catch{
      // Garante remoção do style temporário mesmo em caso de erro
      const s=document.getElementById("pdf-export-override");
      if(s)document.head.removeChild(s);
      // Restaura overflow de todos os elementos que possam ter sido alterados
      if(reportRef.current){
        reportRef.current.querySelectorAll<HTMLElement>("[class*='overflow']")
          .forEach((s)=>{s.style.overflow="";});
      }
      toast({title:"Erro ao exportar PDF",variant:"destructive"});
    }finally{
      setExporting(false);
    }
  };

  const temDados=dadosMetas||dadosExecucao||dadosFinanceiro||dadosObras||dadosAlmox||dadosDiario||dadosRanking;

  return(
    <div className="space-y-4">
      {/* Header */}
      <div className="pbi-header flex items-center justify-between gap-2 flex-wrap px-4 py-3 rounded-lg">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5" style={{color:"hsl(var(--pbi-yellow))"}}/>
          <div>
            <h1 className="text-base font-semibold text-white">Relatórios</h1>
            <p className="text-[11px]" style={{color:"hsl(0,0%,72%)"}}>Módulo: {MODULOS.find(m=>m.key===modulo)?.label} · Ano: {anoFiltro}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={carregar} disabled={loading} variant="outline" size="sm" className="gap-1.5 h-8 text-[12px]">
            {loading?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<RefreshCw className="w-3.5 h-3.5"/>}
            Atualizar
          </Button>
          {temDados&&(
            <Button onClick={handleExportPDF} disabled={exporting} size="sm" className="gap-1.5 h-8 text-[12px]"
              style={{background:"hsl(var(--pbi-yellow))",color:"hsl(var(--pbi-dark))"}}>
              {exporting?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Download className="w-3.5 h-3.5"/>}
              Exportar PDF
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="erp-card p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-primary"/>
          <p className="text-[12px] font-semibold text-foreground">Filtros</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Módulo</label>
            <Select value={modulo} onValueChange={setModulo}>
              <SelectTrigger className="h-8 text-[12px]"><SelectValue/></SelectTrigger>
              <SelectContent>
                {MODULOS.map(m=><SelectItem key={m.key} value={m.key} className="text-[12px]">{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Calendar className="w-3 h-3"/>Ano (global)</label>
            <Select value={anoFiltro} onValueChange={setAnoFiltro}>
              <SelectTrigger className="h-8 text-[12px]"><SelectValue/></SelectTrigger>
              <SelectContent>
                {ANOS_DISPONIVEIS.map(a=><SelectItem key={a} value={a} className="text-[12px]">{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Calendar className="w-3 h-3"/>Data Início</label>
            <input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)}
              className="w-full h-8 rounded-md border border-border bg-background px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"/>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Calendar className="w-3 h-3"/>Data Fim</label>
            <input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)}
              className="w-full h-8 rounded-md border border-border bg-background px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"/>
          </div>
        </div>
        {(dataInicio||dataFim)&&(
          <button onClick={()=>{setDataInicio("");setDataFim("");}} className="mt-2 text-[11px] text-muted-foreground hover:text-foreground underline">
            Limpar filtro de data
          </button>
        )}
      </div>

      {/* Seleção rápida por módulo */}
      <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
        {MODULOS.map(m=>{
          const Icon=m.icon;const ativo=modulo===m.key;
          return(
            <button key={m.key} onClick={()=>setModulo(m.key)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-[10px] font-medium"
              style={{
                background:ativo?"hsl(var(--pbi-yellow)/0.15)":"hsl(var(--pbi-surface))",
                border:`1.5px solid ${ativo?"hsl(var(--pbi-yellow))":"hsl(var(--border))"}`,
                color:ativo?"hsl(var(--pbi-yellow))":"hsl(var(--muted-foreground))",
              }}>
              <Icon className="w-4 h-4"/>
              <span className="text-center leading-tight">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {loading&&(
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary"/>
        </div>
      )}

      {!loading&&(
        <div ref={reportRef} className="space-y-10">
          {(modulo==="completo"||modulo==="metas")        &&dadosMetas      &&<RelMetas       data={dadosMetas}/>}
          {(modulo==="completo"||modulo==="execucao")     &&dadosExecucao   &&<RelExecucao    data={dadosExecucao}/>}
          {(modulo==="completo"||modulo==="financeiro")   &&dadosFinanceiro &&<RelFinanceiro  data={dadosFinanceiro}/>}
          {(modulo==="completo"||modulo==="obras")        &&dadosObras      &&<RelObras       data={dadosObras}/>}
          {(modulo==="completo"||modulo==="almoxarifado") &&dadosAlmox      &&<RelAlmox       data={dadosAlmox}/>}
          {(modulo==="completo"||modulo==="diario")       &&dadosDiario     &&<RelDiario      data={dadosDiario}/>}
          {(modulo==="completo"||modulo==="ranking")      &&dadosRanking    &&<RelRanking     data={dadosRanking}/>}

          {!temDados&&(
            <div className="erp-card p-12 rounded-lg border border-border text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3"/>
              <p className="text-sm font-medium text-foreground">Nenhum dado encontrado</p>
              <p className="text-[11px] text-muted-foreground mt-1">Ajuste o filtro de data ou cadastre dados nos módulos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
