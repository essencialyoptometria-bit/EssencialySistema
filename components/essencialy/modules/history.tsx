'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CalendarDays, Cake, Check, ClipboardList, Clock3, FilePlus2, FileText,
  History, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Search,
  Settings, Stethoscope, UserRound, UserPlus, Users, X,
} from 'lucide-react';
import type { Appointment, City, Consultation, Contact, Patient, Prescription, Profile, Schedule, Store } from '@/types/essencialy';
import { br, cash, digits, iso, printDeclaration, tomorrow } from '@/lib/essencialy-utils';
import { Empty, Modal, Status } from '@/components/essencialy/shared-ui';
export function HistoryPage({ consultations, prescriptions }: any) {
  return (
    <>
      <div className="flex justify-between">
        <h2 className="text-3xl font-black">Histórico</h2>
        <button
          className="btn-secondary no-print"
          onClick={() => window.print()}
        >
          Imprimir
        </button>
      </div>
      <section className="card mt-5 divide-y">
        {consultations.length ? (
          consultations.map((c: Consultation) => (
            <article
              className="p-5 grid sm:grid-cols-[1fr_auto] gap-3"
              key={c.id}
            >
              <div>
                <b>{c.patients?.full_name}</b>
                <p className="text-sm text-[#778079]">
                  {c.clinical_notes || 'Sem observações'}
                </p>
              </div>
              <div className="text-sm">
                <p>Exame: {br(c.exam_date)}</p>
                <p className="text-[#8a7560]">Retorno: {br(c.return_date)}</p>
                <button className="btn-secondary no-print mt-2" onClick={()=>printDeclaration(c)}>Declaração</button>
              </div>
            </article>
          ))
        ) : (
          <Empty>Nenhuma consulta registrada.</Empty>
        )}
      </section>
      <p className="text-sm mt-4 text-[#778079]">
        {prescriptions.length} receita(s) preservada(s) no histórico.
      </p>
    </>
  );
}

