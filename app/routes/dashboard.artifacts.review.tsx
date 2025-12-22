/**
 * Panel de Administración - Review de Artefactos
 *
 * Solo accesible para administradores.
 * Permite:
 * - Ver artefactos pendientes de revisión
 * - Preview del código
 * - Aprobar o rechazar con razón
 */

import { useState, useEffect } from "react";
import { useRevalidator, redirect } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import type { Route } from "./+types/dashboard.artifacts.review";
import type { Artifact } from "@prisma/client";
import toast from "react-hot-toast";
import { cn } from "~/lib/utils";
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCode,
  HiOutlineEye,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSparkles,
} from "react-icons/hi";

// Admin emails (debe coincidir con api.v1.artifacts.ts)
const ADMIN_EMAILS = ["brenda@formmy.app", "blissito@gmail.com", "fixtergeek@gmail.com"];

function isAdmin(email: string | null | undefined): boolean {
  return email ? ADMIN_EMAILS.includes(email) : false;
}

export const meta = () => [
  { title: "Admin - Review Artefactos" },
  { name: "description", content: "Revisar artefactos pendientes" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);

  // Check admin access
  if (!isAdmin(user.email)) {
    throw redirect("/dashboard");
  }

  const pendingArtifacts = await db.artifact.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { updatedAt: "asc" }, // FIFO - oldest first
  });

  return { user, artifacts: pendingArtifacts };
};

export default function DashboardArtifactsReview({
  loaderData,
}: Route.ComponentProps) {
  const { artifacts: initialArtifacts } = loaderData;
  const revalidator = useRevalidator();

  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync from props
  useEffect(() => {
    setArtifacts(initialArtifacts);
  }, [initialArtifacts]);

  const handleApprove = async (id: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "approve", id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al aprobar");
      }

      toast.success("Artefacto aprobado y publicado");
      revalidator.revalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al aprobar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error("Debes proporcionar una razón de rechazo");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "reject",
          id,
          reason: rejectReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al rechazar");
      }

      toast.success("Artefacto rechazado");
      setRejectingId(null);
      setRejectReason("");
      revalidator.revalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al rechazar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HiOutlineSparkles className="w-8 h-8 text-brand-500" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Review de Artefactos
          </h1>
        </div>
        <p className="text-gray-500">
          Revisa y aprueba artefactos enviados por desarrolladores
        </p>
      </div>

      {/* Empty state */}
      {artifacts.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <HiOutlineCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay artefactos pendientes
          </h3>
          <p className="text-gray-500">
            Todos los artefactos han sido revisados
          </p>
        </div>
      )}

      {/* Pending list */}
      {artifacts.length > 0 && (
        <div className="space-y-4">
          {artifacts.map((artifact: Artifact) => (
            <div
              key={artifact.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 flex items-center gap-4">
                {/* Icon */}
                {artifact.iconUrl ? (
                  <img
                    src={artifact.iconUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <HiOutlineCode className="w-6 h-6 text-white" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">
                    {artifact.displayName}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {artifact.description}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>{artifact.name}</span>
                    <span>Por: {artifact.authorEmail}</span>
                    {artifact.category && <span>{artifact.category}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === artifact.id ? null : artifact.id)
                    }
                    className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    <HiOutlineEye className="w-4 h-4" />
                    {expandedId === artifact.id ? "Ocultar" : "Ver código"}
                    {expandedId === artifact.id ? (
                      <HiOutlineChevronUp className="w-4 h-4" />
                    ) : (
                      <HiOutlineChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {rejectingId !== artifact.id && (
                    <>
                      <button
                        onClick={() => setRejectingId(artifact.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                        disabled={isSubmitting}
                      >
                        <HiOutlineX className="w-4 h-4" />
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApprove(artifact.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white hover:bg-green-600 rounded-lg text-sm"
                        disabled={isSubmitting}
                      >
                        <HiOutlineCheck className="w-4 h-4" />
                        Aprobar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reject form */}
              {rejectingId === artifact.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón del rechazo
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explica por qué se rechaza este artefacto..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 mb-3"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleReject(artifact.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Rechazando..." : "Confirmar rechazo"}
                    </button>
                  </div>
                </div>
              )}

              {/* Code preview */}
              {expandedId === artifact.id && (
                <div className="border-t border-gray-100">
                  <pre className="p-4 bg-gray-900 text-gray-100 text-sm overflow-x-auto max-h-96">
                    <code>{artifact.code}</code>
                  </pre>

                  {/* Events */}
                  {artifact.events.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-700">
                        Eventos:{" "}
                      </span>
                      {artifact.events.map((event: string) => (
                        <span
                          key={event}
                          className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mr-2"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
