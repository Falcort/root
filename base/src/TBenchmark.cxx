
/*************************************************************************
 * Copyright (C) 1995-2000, Rene Brun and Fons Rademakers.               *
 * All rights reserved.                                                  *
 *                                                                       *
 * For the licensing terms see $ROOTSYS/LICENSE.                         *
 * For the list of contributors see $ROOTSYS/README/CREDITS.             *
 *************************************************************************/

#include "TBenchmark.h"
#include "TROOT.h"
#include "TStopwatch.h"
#include "TMath.h"


TBenchmark *gBenchmark = 0;

ClassImp(TBenchmark)

//______________________________________________________________________________
//////////////////////////////////////////////////////////////////////////
//
// This class is a ROOT utility to help benchmarking applications
//
//  Examples of use of this class are given in the tutorials macros.
//////////////////////////////////////////////////////////////////////////


//______________________________________________________________________________
TBenchmark::TBenchmark(): TNamed()
{
//*-*-*-*-*-*-*-*-*-*-*Benchmark default constructor*-*-*-*-*-*-*-*-*-*-*-*-*-*
//*-*                  =============================

   fNbench   = 0;
   fNmax     = 20;
   fNames    = 0;
   fRealTime = 0;
   fCpuTime  = 0;
   fTimer    = 0;
}

//______________________________________________________________________________
TBenchmark::~TBenchmark()
{
//*-*-*-*-*-*-*-*-*-*-*Benchmark default destructor*-*-*-*-*-*-*-*-*-*-*-*-*-*
//*-*                  ============================

   fNbench   = 0;
   if (fNames)    { delete [] fNames;    fNames  = 0;}
   if (fRealTime) { delete [] fRealTime; fRealTime  = 0;}
   if (fCpuTime)  { delete [] fCpuTime;  fCpuTime  = 0;}
   if (fTimer  )  { delete [] fTimer;    fTimer  = 0;}
}

//______________________________________________________________________________
Int_t TBenchmark::GetBench(const char *name)
{
//*-*-*-*-*-*-*-*-*-*-*Returns index of Benchmark name*-*-*-*-*-*-*-*
//*-*                  ===============================

   for (Int_t i=0;i<fNbench;i++) {
      if (!strcmp(name,(const char*)fNames[i])) return i;
   }
   return -1;
}

//______________________________________________________________________________
Float_t TBenchmark::GetCpuTime(const char *name)
{
//*-*-*-*-*-*-*-*-*-*-*Returns Cpu time used by Benchmark name*-*-*-*-*-*-*-*
//*-*                  =======================================

   Int_t bench = GetBench(name);
   if (bench >= 0) return fCpuTime[bench];
   else            return 0;
}

//______________________________________________________________________________
Float_t TBenchmark::GetRealTime(const char *name)
{
//*-*-*-*-*-*-*-*-*-*-*Returns Realtime used by Benchmark name*-*-*-*-*-*-*-*
//*-*                  =======================================

   Int_t bench = GetBench(name);
   if (bench >= 0) return fRealTime[bench];
   else            return 0;
}

//______________________________________________________________________________
void TBenchmark::Print(const char *name)
{
//*-*-*-*-*-*-*-*-*-*-*Prints parameters of Benchmark name*-*-*-*-*-*-*-*-*-*
//*-*                  ===================================

   Int_t bench = GetBench(name);
   if (bench < 0) return;
   Printf("%-10s: Real Time = %6.2f seconds Cpu Time = %6.2f seconds",name,fRealTime[bench],fCpuTime[bench]);
}

//______________________________________________________________________________
void TBenchmark::Reset()
{
//*-*-*-*-*-*-*-*-*-*-*-*-*-*Reset all Benchmarks*-*-*-*-*-*-*-*-*-*-*-*-*
//*-*                        ====================

   fNbench = 0;

}

//______________________________________________________________________________
void TBenchmark::Show(const char *name)
{
//*-*-*-*-*-*-*-*-*Stops Benchmark name and Prints results*-*-*-*-*-*-*-*-*-*
//*-*              =======================================

   Stop(name);
   Print((char*)name);
}

//______________________________________________________________________________
void TBenchmark::Start(const char *name)
{
//*-*-*-*-*-*-*-*-*-*-*-*-*-*-*Starts Benchmark name*-*-*-*-*-*-*-*-*-*
//*-*                          =====================
//*-*
//*-*   An independent timer (see class TStopwatch) is started.
//*-*   the name of the benchmark is entered into the list of benchmarks.
//*-*   Benchmark can be stopped via TBenchmark::Stop
//*-*   Results can be printed via TBenchmark::Print
//*-*   TBenchmark::Show can be used to stop benchmark and print results.
//*-*   If name is an already existing benchmark, existing parameters are reset.
//*-*   A summary of all benchmarks can be seen via TBenchmark::Summary.
//*-*
//*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-**-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
   if (!fNbench) {
      fNames    = new TString[fNmax];
      fRealTime = new Float_t[fNmax];
      fCpuTime  = new Float_t[fNmax];
      fTimer    = new TStopwatch[fNmax];
   }
   Int_t bench = GetBench(name);
   if (bench < 0 && fNbench < fNmax ) {
   // define a new benchmark to Start
      fNames[fNbench] = name;
      bench = fNbench;
      fNbench++;
      fTimer[bench].Reset();
      fTimer[bench].Start();
      fRealTime[bench] = 0;
      fCpuTime[bench]  = 0;
   } else if (bench >=0) {
   // Resume the existen benchmark
      fTimer[bench].Continue();
   }
   else
     Warning("Start","too many benches");

}

//______________________________________________________________________________
void TBenchmark::Stop(const char *name)
{
//*-*-*-*-*-*-*-*-*-*-*Terminates Benchmark name*-*-*-*-*-*-*-*-*-*-*-*
//*-*                  =========================

   Int_t bench = GetBench(name);
   if (bench < 0) return;

   fRealTime[bench] = fTimer[bench].RealTime();
   fCpuTime[bench]  = fTimer[bench].CpuTime();

}

//______________________________________________________________________________
void TBenchmark::Summary(Float_t &rt, Float_t &cp)
{
//*-*-*-*-*-*-*-*-*-*-*-*-*-*Prints a summary of all benchmarks*-*-*-*-*-*-*-*
//*-*                        ==================================

   rt = 0;
   cp = 0;
   for (Int_t i=0;i<fNbench;i++) {
      Printf("%-10s: Real Time = %6.2f seconds Cpu Time = %6.2f seconds",(const char*)fNames[i],fRealTime[i],fCpuTime[i]);
      rt += fRealTime[i];
      cp += fCpuTime[i];
   }
   Printf("%-10s: Real Time = %6.2f seconds Cpu Time = %6.2f seconds","TOTAL",rt,cp);

}
