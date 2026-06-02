"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, CheckCircle } from "lucide-react"
import Papa from "papaparse"

const CCT_FIELDS = [
  { key: "client_name", label: "Client Name", required: true },
  { key: "job_title", label: "Job Title", required: false },
  { key: "company_name", label: "Company Name", required: true },
  { key: "client_phone", label: "Phone", required: false },
  { key: "other_phone", label: "Other Phone", required: false },
  { key: "client_email", label: "Email", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "notes", label: "Notes", required: false },
]

export default function ImportClients() {
  const [step, setStep] = useState(1)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [csvData, setCsvData] = useState([])
  const [mapping, setMapping] = useState({})
  const [preview, setPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)
  const [user, setUser] = useState(null)
  const router = useRouter()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        setCsvHeaders(headers)
        setCsvData(results.data)

        const autoMapping = {}
        CCT_FIELDS.forEach(field => {
          const match = headers.find(h =>
            h.toLowerCase().includes(field.key.replace("client_", "").replace("_", " ")) ||
            h.toLowerCase() === field.key.toLowerCase()
          )
          if (match) autoMapping[field.key] = match
        })

        const firstNameCol = headers.find(h => h.toLowerCase().includes("first name") || h.toLowerCase() === "first name")
        const lastNameCol = headers.find(h => h.toLowerCase().includes("last name") || h.toLowerCase() === "last name")
        if (firstNameCol && lastNameCol) {
          autoMapping["client_name"] = `${firstNameCol}+${lastNameCol}`
        }

        setMapping(autoMapping)
        setStep(2)
      }
    })
  }

  const getPreview = () => {
    return csvData.slice(0, 5).map(row => {
      const mapped = {}
      CCT_FIELDS.forEach(field => {
        const col = mapping[field.key]
        if (!col) return
        if (col.includes("+")) {
          const [a, b] = col.split("+")
          mapped[field.key] = `${row[a] || ""} ${row[b] || ""}`.trim()
        } else {
          mapped[field.key] = row[col] || ""
        }
      })
      return mapped
    })
  }

  const handleImport = async () => {
    setImporting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const userName = user?.email?.split("@")[0]

    const rows = csvData.map(row => {
      const mapped = { status: "New", created_by: userName}
      CCT_FIELDS.forEach(field => {
        const col = mapping[field.key]
        if (!col) return
        if (col.includes("+")) {
          const [a, b] = col.split("+")
          mapped[field.key] = `${row[a] || ""} ${row[b] || ""}`.trim()
        } else {
          mapped[field.key] = row[col] || ""
        }
      })
      return mapped
    })

    const { error } = await supabase.from("clients").insert(rows)
    if (!error) {
      setImported(rows.length)
      setStep(3)
    }
    setImporting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-6">
  <button onClick={() => router.push("/dashboard")}
    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition">
    <ArrowLeft size={16} /> Back to Dashboard
  </button>
  <div className="flex flex-col items-center">
    <img src="https://smart.sa/wp-content/themes/smart/images/logo.svg" alt="SMART" className="h-7" />
    <p className="mt-1 text-gray-900 tracking-widest" style={{ fontSize: "11px" }}>Cold Call Track</p>
  </div>
</div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Import Clients from CSV</h1>
          <p className="text-xs text-gray-400 mb-6">Upload a CSV file from Apollo or any source and map the columns</p>

          {/* Step 1 - Upload */}
          {step === 1 && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-16 cursor-pointer hover:border-red-300 transition">
              <Upload size={32} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">Click to upload CSV file</p>
              <p className="text-xs text-gray-400 mt-1">Supports Apollo exports and any CSV</p>
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
            </label>
          )}

          {/* Step 2 - Mapping */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Map Columns</h2>
                <div className="space-y-3">
                  {CCT_FIELDS.map(field => (
                    <div key={field.key} className="flex items-center gap-4">
                      <div className="w-40">
                        <p className="text-xs font-medium text-gray-700">{field.label}</p>
                        {field.required && <p className="text-xs text-red-500">Required</p>}
                      </div>
                      <select
                        value={mapping[field.key] || ""}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-700"
                      >
                        <option value="">— Skip —</option>
                        {field.key === "client_name" && csvHeaders.find(h => h.toLowerCase().includes("first")) && csvHeaders.find(h => h.toLowerCase().includes("last")) && (
                          <option value={`${csvHeaders.find(h => h.toLowerCase().includes("first name") || h.toLowerCase() === "first name")}+${csvHeaders.find(h => h.toLowerCase().includes("last name") || h.toLowerCase() === "last name")}`}>
                            First Name + Last Name (Combined)
                          </option>
                        )}
                        {csvHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Preview (first 5 rows)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-100 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        {CCT_FIELDS.map(f => (
                          <th key={f.key} className="px-3 py-2 text-left text-gray-400 font-medium">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getPreview().map((row, i) => (
                        <tr key={i} className="border-t border-gray-50">
                          {CCT_FIELDS.map(f => (
                            <td key={f.key} className="px-3 py-2 text-gray-600">{row[f.key] || "-"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
                  Back
                </button>
                <button onClick={handleImport} disabled={importing}
                  className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium px-6 py-3 rounded-xl transition">
                  {importing ? "Importing..." : `Import ${csvData.length} Clients`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Success */}
          {step === 3 && (
            <div className="text-center py-12">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{imported} Clients Imported!</h2>
              <p className="text-sm text-gray-400 mb-6">All clients have been added to your dashboard</p>
              <button onClick={() => router.push("/dashboard")}
                className="bg-red-700 hover:bg-red-800 text-white text-sm font-medium px-6 py-3 rounded-xl transition">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}