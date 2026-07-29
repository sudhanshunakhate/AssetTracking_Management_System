import { useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'
import { employees, stores } from '@/data/mock'

type Tab = 'inward' | 'outward'

export function GatepassPage() {
  const [tab, setTab] = useState<Tab>('inward')
  const [inwardType, setInwardType] = useState<'returnable' | 'new'>('returnable')

  return (
    <FadeContent>
      <PageHeader
        title="Gatepass"
        description="Single window for all store-gate movement — record material received (Inward) and issue Outward Forms from one place."
      />

      <div className="mb-4 flex gap-2.5 border-b border-[var(--border)] pb-3.5">
        <Button variant={tab === 'inward' ? 'primary' : 'ghost'} onClick={() => setTab('inward')}>
          Material Inward
        </Button>
        <Button variant={tab === 'outward' ? 'primary' : 'danger'} onClick={() => setTab('outward')}>
          Outward Form
        </Button>
      </div>

      {tab === 'inward' ? (
        <div>
          <div className="mb-3">
            <div className="text-lg font-bold text-[var(--text)]">Material Inward</div>
            <div className="text-[12.5px] text-[var(--text2)]">
              Record material received into stores — against a returnable Outward Form, or as a fresh inward entry.
            </div>
          </div>

          <Card>
            <CardBody>
              <div className="max-w-sm">
                <Field label="Inward Type" required>
                  <Select
                    value={inwardType}
                    onChange={(e) => setInwardType(e.target.value as 'returnable' | 'new')}
                  >
                    <option value="returnable">Against Returnable Outward</option>
                    <option value="new">New Inward Entry</option>
                  </Select>
                </Field>
              </div>
            </CardBody>
          </Card>

          {inwardType === 'returnable' ? (
            <Card>
              <CardHeader
                title="Select Returnable Outward"
                subtitle="Choose an Outward Form marked Returnable — its details load automatically"
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Returnable Outward No." required className="md:col-span-2">
                    <Select>
                      <option value="">— Select Outward No. —</option>
                      <option>OF-2026-014 – Returnable</option>
                      <option>OF-2026-009 – Returnable</option>
                    </Select>
                  </Field>
                  <Field label="Outward Date">
                    <Input value="—" disabled />
                  </Field>
                  <Field label="Customer">
                    <Input value="—" disabled />
                  </Field>
                  <Field label="Sender Department">
                    <Input value="—" disabled />
                  </Field>
                  <Field label="Total Items">
                    <Input value="—" disabled />
                  </Field>
                  <Field label="Received By">
                    <Select>
                      <option value="">— Select Employee —</option>
                      {employees.map((e) => (
                        <option key={e.code} value={e.code}>
                          {e.code} – {e.firstName} {e.lastName}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Received Date">
                    <Input type="date" />
                  </Field>
                  <Field label="Condition on Return">
                    <Select>
                      <option>Good</option>
                      <option>Damaged</option>
                      <option>Partial</option>
                    </Select>
                  </Field>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button>Approve & Receive</Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader title="Inward Details" />
                <CardBody>
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Inward No." required>
                      <Input value="Auto-generated" disabled />
                    </Field>
                    <Field label="Inward Date" required>
                      <Input type="date" />
                    </Field>
                    <Field label="Returnable / Non Returnable">
                      <Select>
                        <option>Non Returnable</option>
                        <option>Returnable</option>
                      </Select>
                    </Field>
                    <Field label="Receiving Department">
                      <Select>
                        <option value="">— Select Department —</option>
                        <option>Stores</option>
                        <option>IT</option>
                        <option>Operations</option>
                      </Select>
                    </Field>
                    <Field label="Prepared By">
                      <Select>
                        <option value="">— Select Employee —</option>
                        {employees.map((e) => (
                          <option key={e.code} value={e.code}>
                            {e.code} – {e.firstName} {e.lastName}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Store" required>
                      <Select>
                        <option value="">— Select Store —</option>
                        {stores.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.code} – {s.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Remarks" className="md:col-span-2">
                      <Input placeholder="Remarks…" />
                    </Field>
                  </div>
                </CardBody>
              </Card>
              <FormActions
                onClear={() => undefined}
                onBack={() => setInwardType('returnable')}
                onSave={() => undefined}
                saveLabel="Save Inward"
              />
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <div className="text-lg font-bold text-[var(--text)]">Outward Form</div>
            <div className="text-[12.5px] text-[var(--text2)]">
              Issue material out of the store gate — returnable or non-returnable.
            </div>
          </div>
          <Card>
            <CardHeader title="Outward Details" />
            <CardBody>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Outward No." required>
                  <Input value="Auto-generated" disabled />
                </Field>
                <Field label="Outward Date" required>
                  <Input type="date" />
                </Field>
                <Field label="Returnable / Non Returnable" required>
                  <Select>
                    <option>Non Returnable</option>
                    <option>Returnable</option>
                  </Select>
                </Field>
                <Field label="Sender Department">
                  <Select>
                    <option value="">— Select Department —</option>
                    <option>Stores</option>
                    <option>IT</option>
                    <option>Operations</option>
                  </Select>
                </Field>
                <Field label="Prepared By" required>
                  <Select>
                    <option value="">— Select Employee —</option>
                    {employees.map((e) => (
                      <option key={e.code} value={e.code}>
                        {e.code} – {e.firstName} {e.lastName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Customer / Party" className="md:col-span-2">
                  <Input placeholder="Customer or receiving party" />
                </Field>
                <Field label="Remarks" className="md:col-span-2">
                  <Input placeholder="Remarks…" />
                </Field>
              </div>
            </CardBody>
          </Card>
          <FormActions
            onClear={() => undefined}
            onBack={() => setTab('inward')}
            onSave={() => undefined}
            saveLabel="Save Outward"
          />
        </div>
      )}
    </FadeContent>
  )
}
