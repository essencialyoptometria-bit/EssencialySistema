'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CalendarDays, Cake, Check, ClipboardList, Clock3, FilePlus2, FileText,
  History, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Search,
  Settings, Stethoscope, UserRound, UserPlus, Users, X,
} from 'lucide-react';
import type { Appointment, City, Consultation, Contact, Patient, Prescription, Profile, Schedule, Store } from '@/types/essencialy';
<<<<<<< HEAD
import { br, calculateAge, cash, digits, iso, printDeclaration, tomorrow } from '@/lib/essencialy-utils';
=======
import { br, cash, digits, iso, printDeclaration, tomorrow } from '@/lib/essencialy-utils';
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
import { Empty, Modal, Status } from '@/components/essencialy/shared-ui';
export function Config({ profile, cities, stores, load, flash }: any) {
  const [tab, setTab] = useState('local');
  async function location(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    let city = String(f.get('city_id') || '');
    if (!city) {
      const { data, error } = await supabase
        .from('cities')
        .insert({ name: f.get('city_name') })
        .select()
        .single();
      if (error) return flash(error.message);
      city = data.id;
    }
    const { error } = await supabase
      .from('optical_stores')
      .insert({ city_id: city, name: f.get('store_name') });
    if (error) flash(error.message);
    else {
      flash('Cidade e ótica salvas.');
      load();
    }
  }
  async function migrate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const raw = JSON.parse(String(new FormData(e.currentTarget).get('json')));
      const source = Array.isArray(raw) ? raw : raw.patients || [];
      const rows = source.map((p: any) => ({
        legacy_id: String(p.id || ''),
        full_name: p.nome,
        phone: digits(p.telefone),
        cpf: digits(p.cpf) || null,
<<<<<<< HEAD
        birth_date: p.dataNascimento?.slice?.(0, 10) || null,
        age: calculateAge(p.dataNascimento?.slice?.(0, 10)),
=======
        rg: p.rg || null,
        birth_date: p.dataNascimento?.slice?.(0, 10) || null,
        age: Number(p.idade) || null,
>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
        address: p.endereco || null,
        city_name: p.cidade || null,
        notes: p.observacao || null,
        triage: p,
        created_by: profile.id,
        created_store_id:
          String(new FormData(e.currentTarget).get('import_store') || '') ||
          null,
      }));
      const { error } = await supabase
        .from('patients')
        .upsert(rows, { onConflict: 'legacy_id' });
      if (error) throw error;
      flash(`${rows.length} pacientes importados sem duplicar.`);
      load();
    } catch (e: any) {
      flash(e.message || 'Dados inválidos');
    }
  }
  return (
    <>
      <h2 className="text-3xl font-black">Configurações</h2>
      <div className="flex gap-2 mt-5">
        <button className="btn-secondary" onClick={() => setTab('local')}>
          Cidades e óticas
        </button>
        <button className="btn-secondary" onClick={() => setTab('import')}>
          Importar planilha
        </button>
      </div>
      {tab === 'local' ? (
        <form
          onSubmit={location}
          className="card p-5 mt-4 max-w-2xl grid sm:grid-cols-2 gap-4"
        >
          <label className="label">
            Cidade existente
            <select className="field" name="city_id">
              <option value="">Criar nova</option>
              {cities.map((c: City) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            Nova cidade
            <input className="field" name="city_name" />
          </label>
          <label className="label sm:col-span-2">
            Nome da ótica
            <input className="field" name="store_name" required />
          </label>
          <button className="btn-primary sm:col-span-2">Salvar</button>
        </form>
      ) : (
        <form onSubmit={migrate} className="card p-5 mt-4 max-w-3xl">
          <b>Migração da planilha antiga</b>
          <p className="text-sm text-[#778079] mt-1">
            Cole o JSON exportado pelo aplicativo antigo. O identificador
            original é mantido para impedir duplicações.
          </p>
          <label className="label mt-4">
            Ótica responsável pelos cadastros importados
            <select name="import_store" className="field" required>
              <option value="">Selecione</option>
              {stores.map((store: Store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          <textarea
            name="json"
            className="field min-h-64 mt-4 font-mono text-xs"
            required
            placeholder='{"patients":[...]}'
          />
          <button className="btn-primary mt-4">Importar dados</button>
        </form>
      )}
    </>
  );
}
<<<<<<< HEAD
=======

>>>>>>> 94f138011f100fb253dc2d9d895d7f497894e50c
