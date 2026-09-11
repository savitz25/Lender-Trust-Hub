# Scalar grain label follow-up

Final visual inspection of 2223efb found a generic Institution / research snapshot interpretation label on scalar counts. The numeric value, selected scope and source Trace were correct, but that interpretation label did not identify the counted observations. The scalar result now replaces it with the selected action and actual source/output grain; institution results keep their own interpretation.

label-red-before.txt records the new behavioral test failing against unchanged HEAD source. The clean suite passes 26/26; R1-002 passes 24/24; npm test, changed-file lint and production build pass. The browser gate now asserts that scalar results contain Counted observations and never the generic Entity grain label. All 14 local production-build browser/API cases pass, maximum 652 ms. No source selection, numeric measure, data, schema or production configuration changed.

This correction must receive its own production proof before final ticket closure. Earlier artifacts remain an honest record of the numerical/source certification and its tested revision.
