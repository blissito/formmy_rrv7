/**
 * Artefacto Nativo: Selector de Fecha/Hora
 *
 * Artefacto oficial de Formmy para agendar citas y reservas.
 *
 * PROPS (initialData):
 * - minDate: string - Fecha mínima (YYYY-MM-DD)
 * - maxDate: string - Fecha máxima (YYYY-MM-DD)
 * - availableSlots: string[] - Horarios disponibles ["9:00", "10:00", "14:00"]
 *
 * EVENTS:
 * - onSelect: { date, time, dateTime } - Usuario confirmó selección
 * - onCancel: {} - Usuario canceló
 */

const ARTIFACT_CODE = `
const ArtifactComponent = ({ data, phase, outcome, onEvent }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const {
    minDate,
    maxDate,
    availableSlots = ["9:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  } = data || {};

  // Parse dates
  const minDateObj = minDate ? new Date(minDate) : new Date();
  const maxDateObj = maxDate ? new Date(maxDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Padding for first week
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const isDateDisabled = (date) => {
    if (!date) return true;
    return date < minDateObj || date > maxDateObj;
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatDate = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onEvent("onSelect", {
        date: formatDate(selectedDate),
        time: selectedTime,
        dateTime: formatDate(selectedDate) + "T" + selectedTime,
      });
    }
  };

  const handleCancel = () => {
    onEvent("onCancel", {});
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="p-4 bg-white rounded-lg max-w-sm">
      <h3 className="text-lg font-bold mb-4 text-gray-900">Selecciona fecha y hora</h3>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ←
        </button>
        <span className="font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-gray-500 py-1">
            {day}
          </div>
        ))}
        {days.map((date, idx) => (
          <button
            key={idx}
            onClick={() => date && !isDateDisabled(date) && setSelectedDate(date)}
            disabled={isDateDisabled(date)}
            className={\`
              p-2 text-sm rounded-lg transition-colors
              \${!date ? "invisible" : ""}
              \${isDateDisabled(date) ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"}
              \${isDateSelected(date) ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
            \`}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Horarios disponibles:</p>
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={\`
                  px-3 py-1.5 rounded-lg text-sm transition-colors
                  \${selectedTime === slot
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                  }
                \`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection summary */}
      {selectedDate && selectedTime && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Seleccionado:</strong><br />
            {formatDate(selectedDate)} a las {selectedTime}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime}
          className={\`
            flex-1 px-4 py-2 rounded-lg transition-colors
            \${selectedDate && selectedTime
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          \`}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};
`;

export default ARTIFACT_CODE;

// ============================================================================
// METADATA
// ============================================================================

export const ARTIFACT_METADATA = {
  displayName: "Selector de Fecha/Hora",
  description:
    "Permite al usuario seleccionar una fecha y hora de los horarios disponibles. Ideal para agendar citas, reservas o programar eventos.",
  category: "calendars",
  events: ["onSelect", "onCancel"],
  propsSchema: {
    type: "object",
    properties: {
      minDate: {
        type: "string",
        description: "Fecha mínima seleccionable (YYYY-MM-DD)",
      },
      maxDate: {
        type: "string",
        description: "Fecha máxima seleccionable (YYYY-MM-DD)",
      },
      availableSlots: {
        type: "array",
        items: { type: "string" },
        description: "Array de horarios disponibles ['9:00', '10:00', '14:00']",
      },
    },
  },
};
