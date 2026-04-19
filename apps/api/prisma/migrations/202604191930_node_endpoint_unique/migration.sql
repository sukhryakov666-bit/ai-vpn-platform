-- CreateIndex
CREATE UNIQUE INDEX "Node_endpointHost_endpointPort_key" ON "Node"("endpointHost", "endpointPort");
